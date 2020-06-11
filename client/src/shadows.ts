import { getAsset } from './assets'
import { fixedSizeDrawingLayer, draw, position, Entity, xyz, XYZ, zero, Layer, negone, mul, Polygon, sub } from 'tiny-game-engine/lib/index'
import { Map } from '../../types/types'
import { buildWallPolygons, buildPolygons } from './maps'

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
  round: string
  layer: Layer
  casters: Polygon[]
  lights: Light[]
}

function buildShadowCaster(map: Map, round: string): ShadowCaster {
  const casters = buildWallPolygons(map).concat(buildPolygons(map))
  const layer = fixedSizeDrawingLayer(
    map.tiles[0].length * map.tileSize,
    map.tiles.length * map.tileSize
  )
  const lights = buildLights()
  return { casters, layer, lights, round }
}

function drawShadows({ casters, layer, lights }: ShadowCaster, worldOffset: XYZ) {
  drawAmbient(layer)
  // drawShadowCasters(casters, worldOffset)
  drawLightSources(lights)
  // drawEffectiveShadowCasters(lights, shadowCasters, worldOffset)
  drawShadowRays(lights, casters)
  drawLightsOverAmbient(lights, layer)
  draw((ctx, cw, ch) => {
    ctx.translate(worldOffset.x, worldOffset.y)
    ctx.globalAlpha = 0.75
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

export function drawShadowCasters(shadowCasters: Polygon[], worldOffset: XYZ) {
  draw((ctx, cw, ch) => {
    ctx.translate(worldOffset.x, worldOffset.y)
    for (let poly of shadowCasters || []) {
      ctx.strokeStyle = 'red'
      ctx.beginPath()
      ctx.moveTo(poly[0].x, poly[0].y)
      poly.slice(1).map(p => ctx.lineTo(p.x, p.y))
      ctx.closePath()
      ctx.stroke()
    }
  })
}

function drawEffectiveShadowCasters(lights: Light[], wallPolygons: Polygon[], worldOffset: XYZ) {
  drawShadowCasters(wallPolygons.filter(poly => lights.some(light => isWithin(light, poly))), worldOffset)
}

function drawLightSources(lights: Light[]) {
  for (let {image, layer, dir} of lights) {
    draw((ctx, cw, ch) => {
      ctx.clearRect(-cw, -ch, cw*2, ch*2)
      ctx.rotate(dir.radian)
      ctx.drawImage(image, 0, -image.height/2)
    }, undefined, layer)
  }
}

function isWithin(light: Light, poly: Polygon) {
  const distance = light.dim.size/4
  const point = light.pos.cor
  return sub(poly[0], point).size < distance
      || sub(poly[1], light.pos.cor).size < distance
      || sub(poly[2], light.pos.cor).size < distance
      || sub(poly[3], light.pos.cor).size < distance
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

function determineShadows(light: Light, poly: Polygon): Polygon[] {
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
        let l2p = sub(point, light.pos.cor)//normalize(sub(point, light.pos.cor))
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

  return shadows.map(vertices => vertices.map(({x, y}) => xyz(x, y)))
}

function normalize(vector: XYZ): XYZ {
  return xyz(vector.x / vector.size, vector.y / vector.size)
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

function getShadowOpacity(cor: XYZ, {layer}: ShadowCaster) {
  const {x, y} = cor
  const imgData = layer.context.getImageData(x, y, 1, 1).data
  return imgData[0]
}

export { drawShadows, getShadowOpacity, buildShadowCaster, ShadowCaster }