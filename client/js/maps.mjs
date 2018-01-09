import buildDecoration from './decorations.mjs'

function buildCollisionData(map, emptyTile) {
  const colData = [],
      w = map.width,
      h = map.height,
      tw = map.tileWidth,
      th = map.tileHeight
  for(let y=0; y<h; y=y+th) {
    const row = []
    for(let x=0; x<w; x=x+tw) {
      row.push(map.checkTile(x, y) == emptyTile ? 0 : 1)
    }
    colData.push(row)
  }
  return colData
}

function buildFloorData(floorMap, mapData) {
  const w = mapData.width,
        h = mapData.height,
        tw = floorMap.tileWidth,
        th = floorMap.tileHeight,
        cx = Math.ceil(w / tw),
        cy = Math.ceil(h / th)
  return new Array(cy).fill(0).map(x => new Array(cx).fill(0))
}

class FloorMapNode extends enchant.Node {

  constructor (mapData, width, height) {
    super()
    const game = enchant.Game.instance,
        img = game.assets[mapData.floorImage]
    this._image = new enchant.Surface(width, height)
    for(let y=0; y<height; y=y+img.height) {
      for(let x = 0; x<width; x=x+img.width) {
        this._image.context.drawImage(img._element, x, y)
      }
    }
  }

  cvsRender (ctx) {
    if(this._image) {
      ctx.drawImage(this._image._element, 0, 0);
    }
  }
}

class Map extends enchant.Map {
  constructor(mapData) {
    super(mapData.tileSize, mapData.tileSize)
    this.image = enchant.Game.instance.assets[mapData.tileImage]
    this.loadData(mapData.tileData)
    this.collisionData = buildCollisionData(this, mapData.emptyTile)
  }

  reset () {
    this._context.clearRect(0, 0, this._context.canvas.width, this._context.canvas.height)
  }

  collides (x, y, w2, h2) {
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

  isWithin (x, y, w, h) {
    return 0 <= x && 
            x + w < this.width && 
            0 <= y && 
            y + h < this.height
  }

}

export function buildFloor (mapData, width, height) {
  return new FloorMapNode(mapData, width, height)
}

export function buildWalls (mapData) {
  return new Map(mapData)
}

export function buildDecorations (mapData) {
  const tiles = mapData.tiles,
        w = tiles[0].length,
        h = tiles.length,
        tw = mapData.tileSize,
        th = mapData.tileSize,
        decs = new enchant.Group()
  for(let y=0; y<h; y++) {
    for(let x=0; x<w; x++) {
      let tile = tiles[y][x]
      let decoration = buildDecoration(tile, x * tw, y * th)
      if (decoration) decs.addChild(decoration)
    }
  }
  return decs
}
