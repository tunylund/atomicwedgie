import { getAsset } from './assets'
import { fixedSizeDrawingLayer, draw, position, Entity, xyz, XYZ, zero, Layer, negone, mul } from 'tiny-game-engine/lib/index'
import { Player } from './players'
import { Map, isSolid } from './maps'

interface Light extends Entity {
  image: HTMLImageElement
  layer: Layer
}

function buildLights(): Light[] {
  const image = getAsset<HTMLImageElement>('lightCone')
  const layer = fixedSizeDrawingLayer(image.width * 2, image.height * 2)
  return [{
    pos: position(),
    dir: zero,
    dim: xyz(image.width * 2, image.height * 2),
    image, layer
  }]
}

interface ShadowCaster {
  layer: Layer
  casters: Polygon[]
  lights: Light[]
}

function buildShadowCaster(map: Map): ShadowCaster {
  const casters = buildWallPolygons(map)
  const layer = fixedSizeDrawingLayer(
    map.tiles[0].length * map.tileSize,
    map.tiles.length * map.tileSize
  )
  const lights = buildLights()
  return { casters, layer, lights }
}

function drawShadows({ casters, layer, lights }: ShadowCaster, worldOffset: XYZ) {
  drawAmbient(layer)
  // drawShadowCasters(shadowCasters, worldOffset)
  drawLightSources(lights)
  // drawEffectiveShadowCasters(lights, shadowCasters, worldOffset)
  drawShadowRays(lights, casters)
  drawLightsOverAmbient(lights, layer)
  draw((ctx, cw, ch) => {
    ctx.translate(worldOffset.x, worldOffset.y)
    ctx.drawImage(layer.canvas, 0, 0)
  })
}

function drawAmbient(shadowLayer: Layer) {
  draw((ctx, cw, ch) => {
    ctx.clearRect(-cw, -ch, cw * 2, ch * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(-cw, -ch, cw * 2, ch * 2)
    ctx.fill()
  }, undefined, shadowLayer)
}

function drawLightsOverAmbient(lights: Light[], shadowLayer: Layer) {
  draw((ctx, cw, ch) => {
    ctx.translate(-cw, -ch)
    ctx.globalCompositeOperation = "xor"
    for (let light of lights) {
      ctx.translate(-light.dim.x2, -light.dim.y2)
      ctx.drawImage(light.layer.canvas, light.pos.cor.x, light.pos.cor.y)
    }
    ctx.globalCompositeOperation = "source-over"
  }, undefined, shadowLayer)
}

type Vertice = { x: number, y: number }
type Polygon = Vertice[]

function drawShadowCasters(shadowCasters: Polygon[], worldOffset: XYZ) {
  draw((ctx, cw, ch) => {
    ctx.translate(worldOffset.x, worldOffset.y)
    for (let poly of shadowCasters) {
      ctx.strokeStyle = 'red'
      ctx.strokeRect(poly[0].x, poly[0].y, poly[2].x - poly[0].x, poly[2].y - poly[0].y)
    }
  })
}

function drawEffectiveShadowCasters(lights: Light[], wallPolygons: Polygon[], worldOffset: XYZ) {
  drawShadowCasters(wallPolygons.filter(poly => lights.some(light => isWithin(light, poly))), worldOffset)
}

function drawLightSources(lights: Light[]) {
  for (let {image, layer, dir} of lights) {
    draw((ctx, cw, ch) => {
      ctx.rotate(dir.radian)
      ctx.drawImage(image, 0, -image.height/2)
    }, undefined, layer)
  }
}

// function isWithin(light: Light, poly: Polygon): boolean {
//   const a1 = {
//     x: light.pos.cor.x - light.dim.x2,
//     y: light.pos.cor.y - light.dim.y2
//   } as XYZ
//   const a2 = add(a1, light.dim)
//   const b1 = poly[0] as XYZ
//   const b2 = poly[2] as XYZ
//   return segmentIntersects(a1, a2, b1, b2)
// }
function isWithin(light: Light, poly: Polygon) {
  const distance = light.dim.size/4
  const point = light.pos.cor
  return dist(poly[0], point) < distance
          || dist(poly[1], light.pos.cor) < distance
          || dist(poly[2], light.pos.cor) < distance
          || dist(poly[3], light.pos.cor) < distance
}

function dist(a: Vertice, b: Vertice) {
  return Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y))
}

function drawShadowRays(lights: Light[], wallPolygons: Polygon[]) {
  for (let light of lights) {
    const offset = mul(light.pos.cor, negone)
  
    draw((ctx, cw, ch) => {
      for (let poly of wallPolygons) {  
        if(isWithin(light, poly)) {
          for (let shadow of determineShadows(light, poly)) {
            drawTriangleStrip(ctx, shadow, offset)
          }
        }
      }
    }, undefined, light.layer)
  }
}

function determineShadows(light: Light, poly: Polygon): Vertice[][] {
  let shadows = []
  const vertexCount = poly.length

  let shadowThrowingSegments = determineShadowThrowingSegments(light, poly),
      shadowLength = light.dim.x * 8

  for(let i=0, l=shadowThrowingSegments.length; i<l; i++) {
    let shadowSegment = shadowThrowingSegments[i],
        s = shadowSegment[0],
        e = shadowSegment[1],
        shadowVertexCount = 0

    //nr of vertices that are in the shadow
    if (e > s)
      shadowVertexCount = e - s + 1;
    else
      shadowVertexCount = vertexCount + 1 - s + e;

    // Minimum number of points in shadow's width is 2
    if (shadowVertexCount >= 2) {

      let shadowVertices = [],
          curIx = s,
          svCount = 0

      //create a triangle strip that has the shape of the shadow
      while (svCount != shadowVertexCount * 2) {

        let point = poly[curIx]

        //one vertex on the hull
        shadowVertices[svCount] = {
          x: point.x,
          y: point.y
        }

        //one extruded by the light direction
        let l2p = normalize({
          x: point.x - light.pos.cor.x,
          y: point.y - light.pos.cor.y
        })
        shadowVertices[svCount + 1] = {
          x: light.pos.cor.x + l2p.x * shadowLength,
          y: light.pos.cor.y + l2p.y * shadowLength
        }

        svCount += 2;
        curIx = (curIx + 1) % vertexCount;

      }

      shadows.push(shadowVertices);
    }

  }

  return shadows;
}

function normalize(vector: Vertice): Vertice {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y)
  return {
    x: vector.x / length,
    y: vector.y / length
  }
}
function determineShadowThrowingSegments(light: Light, poly: Polygon) {
  let shadowThrowingSegments = [],
      backFacing = determineTheFacingOfEachEdge(light, poly),
      vertexCount = poly.length

  for(let currentEdge = 0; currentEdge < vertexCount; currentEdge++) {
    
    if (!backFacing[currentEdge]) {
      
      let rightEdge = (currentEdge + 1) % vertexCount,
          leftEdge = (currentEdge + vertexCount - 1) % vertexCount

      while (!backFacing[leftEdge] && leftEdge != rightEdge)
        leftEdge = (leftEdge + vertexCount - 1) % vertexCount

      while (!backFacing[rightEdge] && rightEdge != leftEdge)
        rightEdge = (rightEdge + 1) % vertexCount

      let shadowSegment = [
        (leftEdge + 1) % vertexCount,
        rightEdge
      ]

      shadowThrowingSegments.push(shadowSegment);
      
      if (currentEdge < rightEdge)
        currentEdge = rightEdge;
      else
        break;
    
    }
  }

  return shadowThrowingSegments
}

function determineTheFacingOfEachEdge(light: Light, poly: Polygon) {
  let backFacing = []
  const vertexCount = poly.length

  for (let i=0; i<vertexCount; i++) {

    let firstPoint = poly[i],
        secondPoint = poly[( i + 1) % vertexCount],
        middlePoint = {
          x: (firstPoint.x + secondPoint.x) / 2,
          y: (firstPoint.y + secondPoint.y) / 2
        },
        l = {
          x: light.pos.cor.x - middlePoint.x, 
          y: light.pos.cor.y - middlePoint.y
        },
        n = {
          x: -(secondPoint.y - firstPoint.y), 
          y: secondPoint.x - firstPoint.x
        }

    backFacing[i] = n.x * l.x + n.y * l.y > 0

  }

  return backFacing
}

function drawTriangleStrip(ctx: CanvasRenderingContext2D, poly: Polygon, offset: XYZ) {
  for(let i=0, l=poly.length-2; i<l; i++) {
    ctx.beginPath()
    ctx.moveTo(poly[i].x + offset.x, poly[i].y + offset.y)

    for(let j=1; j<3; j++) {
      ctx.lineTo(poly[i+j].x + offset.x, poly[i+j].y + offset.y)
    }

    ctx.closePath()
    ctx.stroke()
    ctx.fill()
  }
}

function buildWallPolygons(map: Map): Polygon[] {

  let pols = [],
      w = map.tiles[0].length * map.tileSize,
      h = map.tiles.length * map.tileSize,
      tw = map.tileSize,
      th = map.tileSize,
      poly = null

  //horPass
  for(let y=th; y<h-th; y=y+th) {
    for(let x=tw; x<w-tw; x=x+tw) {
      let hit = isSolid(map, x, y)
      if(hit) {
        if(poly) {
          poly[1].x = poly[2].x = x + tw
        } else {
          poly = [
            {x: x, y: y},
            {x: x + tw, y: y},
            {x: x + tw, y: y + th},
            {x: x, y: y + th}
          ]
        }
      } else {
        //don't care for 16width polys
        //don't care for outer walls
        if(poly && poly[1].x - poly[0].x > tw) {
          pols.push(poly)
        }
        poly = null
      }
    }
    if(poly && poly[1].x - poly[0].x > tw) {
      pols.push(poly)
    }
    poly = null
  }

  //verPass
  for(let x=tw; x<w-tw; x=x+tw) {
    for(let y=th; y<h-th; y=y+th) {
      let hit = isSolid(map, x, y)
      if(hit) {
        if(poly) {
          poly[2].y = poly[3].y = y + th
        } else {
          poly = [
            {x: x, y: y},
            {x: x + tw, y: y},
            {x: x + tw, y: y + th},
            {x: x, y: y + th}
          ]
        }
      } else {
        //don't care for 16height polys
        if(poly && poly[2].y - poly[1].y > th) {
          pols.push(poly)
        }
        poly = null
      }
    }
    if(poly && poly[2].y - poly[1].y > th) {
      pols.push(poly)
    }
    poly = null
  }

  return pols
}

function getShadowOpacity(cor: XYZ, {layer}: ShadowCaster) {
  const {x, y} = cor
  const imgData = layer.context.getImageData(x, y, 1, 1).data
  return imgData[0]
}

export { drawShadows, getShadowOpacity, buildShadowCaster, ShadowCaster }