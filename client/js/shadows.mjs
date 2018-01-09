const vertexCount = 4, // all polys are rectangles
      minShadowWidth = 2, // Minimum number of points in shadow's width
      shadowLength = 90,
      radiansFactor = Math.PI/180

function buildWallPolygons(map) {

  let pols = [],
      w = map.width,
      h = map.height,
      tw = map.tileWidth,
      th = map.tileHeight,
      poly = null

  //horPass
  for(let y=th; y<h-th; y=y+th) {
    for(let x=tw; x<w-tw; x=x+tw) {
      let hit = map.hitTest(x, y)
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
      let hit = map.hitTest(x, y)
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

function determineShadows(light, poly) {
  let shadows = []

  //TODO
  //the light is inside the hull->no shadows are cast
  //if (IsPointInside(ref lightSource.Position))
  //  return shadows;

  let shadowThrowingSegments = determineShadowThrowingSegments(light, poly),
      shadowLength = light.width * 8

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

    if (shadowVertexCount >= minShadowWidth) {

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
          x: point.x - light.x,
          y: point.y - light.cy
        })
        shadowVertices[svCount + 1] = {
          x: light.x + l2p.x * shadowLength,
          y: light.cy + l2p.y * shadowLength
        }

        svCount += 2;
        curIx = (curIx + 1) % vertexCount;

      }

      shadows.push(shadowVertices);
    }

  }

  return shadows;
}

function normalize(vector) {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y)
  return {
    x: vector.x / length,
    y: vector.y / length
  }
}

function determineShadowThrowingSegments(light, poly) {
  let shadowThrowingSegments = [],
      backFacing = determineTheFacingOfEachEdge(light, poly)

  for(let currentEdge = 0; currentEdge < vertexCount; currentEdge++) {
    
    if (!backFacing[currentEdge]) {
      
      let rightEdge = (currentEdge + 1) % vertexCount,
          leftEdge = (currentEdge + vertexCount - 1) % vertexCount

      while (!backFacing[leftEdge] && leftEdge != rightEdge)
        leftEdge = (leftEdge + vertexCount - 1) % vertexCount

      while (!backFacing[rightEdge] && rightEdge != leftEdge)
        rightEdge = (rightEdge + 1) % vertexCount

      //if (lightIsCastOnHull)
      //  Array.Reverse(shadowSegment);
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

  return shadowThrowingSegments;
}

function determineTheFacingOfEachEdge(light, poly) {
  let backFacing = []

  for (let i=0; i<vertexCount; i++) {

    let firstPoint = poly[i],
        secondPoint = poly[( i + 1) % vertexCount],
        middlePoint = {
          x: (firstPoint.x + secondPoint.x) / 2,
          y: (firstPoint.y + secondPoint.y) / 2
        },
        l = {
          x: light.x - middlePoint.x, 
          y: light.cy - middlePoint.y
        },
        n = {
          x: -(secondPoint.y - firstPoint.y), 
          y: secondPoint.x - firstPoint.x
        }

    backFacing[i] = n.x * l.x + n.y * l.y > 0

  }

  return backFacing
}

function drawTriangleStrip(poly, context, offset) {
  for(let i=0, l=poly.length-2; i<l; i++) {
    context.beginPath()
    context.moveTo(poly[i].x + (offset.x || 0), poly[i].y + (offset.y || 0))

    for(let j=1; j<3; j++) {
      context.lineTo(poly[i+j].x + (offset.x || 0), poly[i+j].y + (offset.y || 0))
    }

    context.closePath()
    context.stroke();
    context.fill()
  }
}

function drawPoints(poly, context, cmutli, offset) {
  context.font = "12pt Arial";
  for(let i=1, l=poly.length; i<l; i++) {
    //context.fillStyle = "rgba(" + (25*i) + ", " + (50*i) + ", " + (100 * i) + ", " + (0.3*i) + ")"
    context.fillStyle = "rgb(255, 255, " + (125*cmutli) + ")"
    //context.fillRect(poly[i].x, poly[i].y, 5, 5)
    context.fillText(i, poly[i].x + offset.x, poly[i].y + offset.y)
  }
}

function drawPoly(poly, context, offset) {
  context.beginPath()
  context.moveTo(poly[0].x + offset.x, poly[0].y + offset.y)
  for(let i=1, l=poly.length; i<l; i++) {
    context.lineTo(poly[i].x + offset.x, poly[i].y + offset.y)
  }
  context.fill()
  context.closePath()
}

function drawDistance(context, center, radius) {
  context.arc(center.x, center.y, radius, 0, Math.PI*2)
  context.stroke();
}

function dist(a, b) {
  return Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y))
}

function within(light, poly, distance, offsetX, offsetY) {
  distance = distance || light.width //Math.sqrt(light.width*light.width + light.h2*light.h2)
  const point = {x: light.x + light.originX + offsetX, y: light.y + light.originY + offsetY}
  return dist(poly[0], point) < distance
          || dist(poly[1], light) < distance
          || dist(poly[2], light) < distance
          || dist(poly[3], light) < distance
}

let map,
    game,
    lights = [],
    wallPolygons = [],
    lightSurface,
    lightSurfaceOffset = {x: 0, y: 0},
    lightAndShadowOffset,
    globalAmbient = "rgba(0,0,0,0.5)"

class Shadows extends enchant.Surface {
  
  constructor (width, height) {
    super(width, height)
    this.w2 = this.width/2
    this.h2 = this.height/2
    this.reset()
    this.on('enterframe', this.onEnterFrame)
    // game = enchant.Game.instance
  }

  setWalls (wallsMap) {
    map = wallsMap
    wallPolygons = buildWallPolygons(wallsMap)
  }

  addLight (light) {
    lights.push(light)
    if(!lightSurface) {
      lightSurface = new Surface(light.width * 2, light.height * 2);
      lightSurface.w2 = lightSurface.width/2
      lightSurface.h2 = lightSurface.height/2        
    }
    this.clearAll()
  }

  removeLight (light) {
    lights.splice(lights.indexOf(light), 1)
    this.clearAll()
  }

  reset () {
    map = null
    wallPolygons = []
    this.clearAll()
    enchant.Game.instance._element.appendChild(this._element)
  }

  onEnterFrame (ctx) {
    if(lights.length > 0 && enchant.Game.instance.player) {
      //this.clearAll()
      this.move()
      //this.clearLight()
      this.drawLights()
      this.drawShadows()
      this.drawLightsToBg()
    }
    //this.drawWallPolys()
  }

  move () {
    const player = enchant.Game.instance.player
    lightAndShadowOffset = {
      x: -Math.floor(player.x + player.w2 - lightSurface.w2),
      y: -Math.floor(player.y + player.h2 - lightSurface.h2)
    }
    lightSurfaceOffset = {
      x: Math.floor(player.x + player.w2 - lightSurface.w2 + this.x),
      y: Math.floor(player.y + player.h2 - lightSurface.h2 + this.y)
    }
  }

  clearLight () {
    const c = lightSurface.context
    c.fillStyle = "rgb(0,0,0)"
    for(let i=0; i<lights.length; i++) {
      const light = lights[i]
      c.fillRect(
        light.player.x, 
        light.player.y, 
        light.player.width, 
        light.player.height
      )
    }
  }

  clearAll () {
    const c = this.context
    c.clearRect(0, 0, this.width, this.height)
    c.fillStyle = globalAmbient
    c.fillRect(0, 0, this.width, this.height)
    c.fill()
    if(lightSurface)
      lightSurface.context.clearRect(0, 0, lightSurface.width, lightSurface.height)
  }

  drawLights () {
    const c = lightSurface.context
    c.save()
    for(let i=0; i<lights.length; i++) {
      const light = lights[i]
      c.x = lightSurface.w2 // light.x - light.w
      c.y = lightSurface.h2 // light.y - light.h
      c.translate(lightSurface.w2/*light.x*/, lightSurface.h2/*light.cy*/)
      c.rotate(light.rotation * radiansFactor)
      c.drawImage(light.image._element, 0, -light.h2)
    }
    c.restore()
  }

  drawLightsToBg () {
    const c = this.context
    c.globalCompositeOperation = "xor"
    this.draw(
      lightSurface, 
      lightSurfaceOffset.x,
      lightSurfaceOffset.y)
    c.globalCompositeOperation = "source-over"
    //c.fillRect(lightSurface.x, lightSurface.y, lightSurface.width, lightSurface.height)
    this.imgData = null
  }

  drawShadows () {
    const c = lightSurface.context
    
    //c.globalCompositeOperation = "xor"

    for(let i=0, il=lights.length; i<il; i++) {
      const light = lights[i]
      
      for(let j=0, jl=wallPolygons.length; j<jl; j++) {
        const poly = wallPolygons[j]

        /*drawDistance(this.context, {
          x: light.x + this.x,
          y: light.cy + this.y
        }, light.width)*/

        if(within(light, poly, null, this.x, this.y)) {
          const shadows = determineShadows(light, poly)

          for(let k=0, kl=shadows.length; k<kl; k++) {
            //drawPoly(shadows[k], c, lightAndShadowOffset)
            drawTriangleStrip(shadows[k], c, lightAndShadowOffset)
            //drawPoints(shadows[k], c, j, lightAndShadowOffset)
          }
        }
      }
    }
    //c.globalCompositeOperation = "source-over"
  }

  drawWallPolys () {
    this.context.fillStyle = "rgba(255,0,0,0.5)"
    for(let j=0, jl=wallPolygons.length; j<jl; j++) {
      const poly = wallPolygons[j]
      if(within(lights[0], poly, null, this.x, this.y)) {
        this.context.fillRect(
          poly[0].x + this.x, 
          poly[0].y + this.y, 
          poly[1].x - poly[0].x, 
          poly[2].y - poly[1].y
        )
      }
    }
  }

  isVisible (enemy) {
    const imgData = this.context.getImageData(
      enemy.cx + this.x || 0, 
      enemy.cy + this.y || 0, 1, 1)
    return imgData.data[0] > 10
  }

  getImgData (x, y) {
    
    if(!this.imgData)
      this.imgData = lightSurface.context.getImageData(0, 0, lightSurface.width, lightSurface.height).data
    return this.imgData[(y - lightSurfaceOffset.y)*lightSurface.width*4 + (x - lightSurfaceOffset.x)*4]
    
    
    //if(!this.imgData)
    //  this.imgData = this.context.getImageData(0, 0, this.width, this.height).data
    //return this.imgData[y*this.width*4 + x*4]

    //return (this.imgData || (this.imgData = this.context.getImageData(0, 0, this.width, this.height).data))[y*this.width + x]
  }

  getOpacity (enemy) {
    const light = lights[0]
    if(light.player.isInView(enemy)) {
      const x = enemy.cx + this.x || 0,
            y = enemy.cy + this.y || 0,
            data = this.getImgData(x, y)
      return data > 10 ? data*4/1000 : 0
    }
    return 0
  }

  remove() {
    
  }

}

/*
var ShadowSprite = enchant.Class.create(enchant.Sprite, {
  
  initialize: function(width, height) {
    enchant.Sprite.call(this, width, height)
    this.w2 = this.width/2
    this.h2 = this.height/2
    lights = []
    this.on('enterframe', this.onEnterFrame)
    game = enchant.Game.instance
  },

  setWalls: function(wallsMap) {
    map = wallsMap
    wallPolygons = buildWallPolygons(wallsMap)
    surface = new Surface(wallsMap.width, wallsMap.height)
    this.image = surface
  },

  addLight: function(light) {
    lights.push(light)
    lightSurface = new Surface(this.width, this.height);
    lightSurface.w2 = lightSurface.width/2
    lightSurface.h2 = lightSurface.height/2
    game.rootScene.addChild(this)
    this.clearAll()
  },

  onEnterFrame: function(ctx) {
    if(lights.length > 0) {
      //this.clearAll()
      //this.clearLight()
      this.drawLights()
      this.drawShadows()
      this.drawLightsToBg()
    }
    //this.drawWallPolys()
  },

  clearLight: function() {
    var c = lightSurface.context
    c.fillStyle = "rgb(0,0,0)"
    for(var i=0; i<lights.length; i++) {
      var light = lights[i]
      c.fillRect(
        light.player.x, 
        light.player.y, 
        light.player.width, 
        light.player.height
      )
    }
  },

  clearAll: function() {
    var c = surface.context
    c.clearRect(0, 0, this.width, this.height)
    c.fillStyle = "rgba(0,0,0,0.5)"
    c.fillRect(0, 0, this.width, this.height)
    c.fill()
    lightSurface.context.clearRect(0, 0, lightSurface.width, lightSurface.height)
  },

  drawLights: function() {
    var c = lightSurface.context
    c.save()
    for(var i=0; i<lights.length; i++) {
      var light = lights[i]
      c.x = light.x - light.w
      c.y = light.y - light.h
      c.translate(light.x, light.cy)
      c.rotate(light.rotation * radiansFactor)
      c.drawImage(light.image._element, 0, -light.h2)
    }
    c.restore()
  },

  drawLightsToBg: function() {
    var c = surface.context
    c.globalCompositeOperation = "xor"
    c.drawImage(lightSurface._element, 0, 0)
    c.globalCompositeOperation = "source-over"
  },

  drawShadows: function() {
    var c = lightSurface.context
    
    //c.globalCompositeOperation = "xor"

    for(var i=0, il=lights.length; i<il; i++) {
      var light = lights[i]
      
      for(var j=0, jl=wallPolygons.length; j<jl; j++) {
        var poly = wallPolygons[j]

        //drawDistance(this.context, {
        //  x: light.x + this.x,
        //  y: light.cy + this.y
        //}, light.width)

        if(within(light, poly, null, 0, 0)) {
          var shadows = determineShadows(light, poly)

          for(var k=0, kl=shadows.length; k<kl; k++) {
            //drawPoly(shadows[k], c, lightAndShadowOffset)
            drawTriangleStrip(shadows[k], c, {x: 0, y: 0})
            //drawPoints(shadows[k], c, j, lightAndShadowOffset)
          }
        }
      }
    }
    //c.globalCompositeOperation = "source-over"
  },

  drawWallPolys: function() {
    this.context.fillStyle = "rgba(255,0,0,0.5)"
    for(var j=0, jl=wallPolygons.length; j<jl; j++) {
      var poly = wallPolygons[j]
      if(within(lights[0], poly, null, this.x, this.y)) {
        this.context.fillRect(
          poly[0].x + this.x, 
          poly[0].y + this.y, 
          poly[1].x - poly[0].x, 
          poly[2].y - poly[1].y
        )
      }
    }
  },

  isVisible: function(enemy) {
    var imgData = surface.context.getImageData(enemy.cx, enemy.cy, 1, 1)
    return imgData.data[0] > 0
  },

  getOpacity: function(enemy) {
    var imgData = surface.context.getImageData(enemy.cx, enemy.cy, 1, 1)
    return imgData.data[0]*4/1000
  }

});
*/

export default Shadows
//return ShadowSprite
