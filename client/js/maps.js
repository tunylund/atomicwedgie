define(["resources", "decorations"], function(res, decorations) {

  function buildCollisionData(map, emptyTile) {
    var colData = [],
        w = map.width,
        h = map.height,
        tw = map.tileWidth,
        th = map.tileHeight
    for(var y=0; y<h; y=y+th) {
      var row = []
      for(var x=0; x<w; x=x+tw) {
        var tile = map.checkTile(x, y)
        row.push(tile == emptyTile ? 0 : 1)
      }
      colData.push(row)
    }
    return colData
  }

  function buildFloorData(floorMap, mapData) {
    var floorData = [],
        w = mapData.width,
        h = mapData.height,
        tw = floorMap.tileWidth,
        th = floorMap.tileHeight,
        cx = Math.ceil(w / tw),
        cy = Math.ceil(h / th)
    for(var y=0; y<cy; y++) {
      var row = []
      for(var x=0; x<cx; x++) {
        row.push(0)
      }
      floorData.push(row)
    }
    return floorData 
  }

  var FloorMap = enchant.Class.create({

    initialize: function(mapData, width, height) {
      var game = enchant.Game.instance
      this.div = document.createElement("div")
      this.div.className = "floorMap"
      this.div.style.backgroundImage = "url(" + mapData.floorImage + ")"
      this.div.style.left = (game.width > width ? (game.width - width) / 2 : 0) + "px"
      this.div.style.top = (game.height > height ? (game.height - height) / 2 : 0) + "px"
      this.div.style.width = (game.width > width ? width : game.width) + "px"
      this.div.style.height = (game.height > height ? height : game.height) + "px"

      game._element.insertBefore(this.div, game._element.childNodes[0])
    },

    draw: function() {
      if(this.x || this.y) {
        this.div.style.backgroundPosition = this.x + "px " + this.y + "px"
      }
    },

    remove: function() {
      this.div.parentNode.removeChild(this.div)
      this.div = null
    }

  })

  var FloorMapNode = enchant.Class.create(enchant.Node, {

    initialize: function(mapData, width, height) {
      enchant.Node.call(this)
      var game = enchant.Game.instance,
          img = game.assets[mapData.floorImage]
      this._image = new enchant.Surface(width, height)
      for(var y=0; y<height; y=y+img.height) {
        for(var x = 0; x<width; x=x+img.width) {
          this._image.context.drawImage(img._element, x, y)
        }
      }
    },

    /*cvsRender: function(ctx) {
      if(this._image) {
        ctx.drawImage(this._image._element, 0, 0);
      }
    }*/
    cvsRender: function(ctx) {
      var game = enchant.Game.instance;
      if (this.width !== 0 && this.height !== 0) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        var cvs = this._image._element,
            sx = game.width > cvs.width ? 0 : -this._offsetX,
            sy = game.height > cvs.height ? 0 : -this._offsetY,
            dx = game.width > cvs.width ? this._offsetX : 0,
            dy = game.height > cvs.height ? this._offsetY : 0
        ctx.drawImage(
          cvs, 
          sx, sy, 
          Math.min(game.width, cvs.width), 
          Math.min(game.height, cvs.height), 
          dx, dy, 
          Math.min(game.width, cvs.width), 
          Math.min(game.height, cvs.height));
        ctx.restore();
      }
    }
  })

  var Map = enchant.Class.create(enchant.Map, {

    initialize: function(tileWidth, tileHeight) {
      enchant.Map.call(this, tileWidth, tileHeight)
    }/*,

    redraw: function(x, y, width, height) {
      enchant.Map.prototype.redraw.call(this, x, y, width, height)
      //this._dirty = false
    }

    /*,

    _dirty: {
      get: function() {
        return this.__dirty
      },
      set: function(d, force) {
        //if(force) this.__dirty = d
      }
    },

    forceDirty: function() {
      this.__dirty = true
    }
*/
  })

  return {

    Map: Map,
    
    floor: function(mapData, width, height) {
      //return new FloorMap(mapData, width, height)
      
      /*
      var game = enchant.Game.instance,
          img = game.assets[mapData.floorImage]
          map = new Map(img.width, img.height)
      map.image = game.assets[mapData.floorImage]
      map.loadData(buildFloorData(map, mapData))
      return map
      */

      var floor = new FloorMapNode(mapData, width, height)
      return floor
    },

    walls: function(mapData) {
      var game = enchant.Game.instance
      map = new Map(mapData.tileSize, mapData.tileSize)
      map.image = game.assets[mapData.tileImage]
      map.loadData(mapData.tileData)
      map.collisionData = buildCollisionData(map, mapData.emptyTile)
      map.isWithin = function(x, y, w, h) {
        return 0 <= x && 
                x + w < map.width && 
                0 <= y && 
                y + h < map.height
      }
      map.collides = function(x, y, w2, h2) {
        return this.hitTest(x, y) //top left
                || this.hitTest(x + w2, y) //top center
                || this.hitTest(x + w2*2, y) //top right
                || this.hitTest(x + w2*2, y + h2) //right center
                || this.hitTest(x + w2*2, y + h2*2) //right btm
                || this.hitTest(x + w2, y + h2*2) //btm center
                || this.hitTest(x, y + h2*2) //btm left
                || this.hitTest(x, y + h2) //left center
                || this.hitTest(x + w2, y + h2) //center
      }
      return map
    },

    decorations: function(mapData) {
      var tiles = mapData.tiles,
          w = tiles[0].length,
          h = tiles.length,
          tw = mapData.tileSize,
          th = mapData.tileSize,
          decs = new enchant.Group()
      for(var y=0; y<h; y++) {
        for(var x=0; x<w; x++) {
          var tile = tiles[y][x]
          for(var type in decorations.types) {
            if(tile == type) {
              decs.addChild(new decorations.Decoration(
                decorations.types[type],
                x * tw,
                y * th
              ))
            }
          }
        }
      }
      return decs
    }

  }

});