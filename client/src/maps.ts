import { draw, XYZ, Polygon, add, xyz } from 'tiny-game-engine/lib/index'
import { getAsset, AssetKey } from './assets'
import { Map } from '../../types/types'
import { textureToPolygon } from './textureToPolygon'

const walls = [ ',', '.', '-', '|', '|', ';', ':' ]

const decorations = new Map<string, AssetKey>([
  [ 'B', 'biliardTable' ],
  [ 'C', 'chair' ],
  [ 'K', 'chair2' ],
  [ 'Q', 'chair2' ],
  [ 'W', 'toilet' ],
  [ 'S', 'sink' ],
  [ 'H', 'cauch' ],
  [ 'T', 'table' ],
  [ 'L', 'table2' ],
  [ 'P', 'table3' ],
  [ 'Z', 'car1' ],
  [ 'X', 'car2' ],
  [ 'O', 'tree1' ],
])

const polygons = new Map<string, AssetKey>([
  [ 'Z', 'car1' ],
  [ 'X', 'car2' ],
  [ 'O', 'tree1' ],
])

function tileNumberToCoordinates(tile: number, tileSize: number, tilesPerRow: number) {
  const row = Math.floor(tile / tilesPerRow) * tileSize
  const col = (tile % tilesPerRow) * tileSize
  return { y: row, x: col }
}

function drawFloor(ctx: CanvasRenderingContext2D, floorImage: HTMLImageElement, w: number, h: number) {
  ctx.fillStyle = ctx.createPattern(floorImage, 'repeat') as CanvasPattern
  ctx.fillRect(0, 0, w, h)
}

export function mapTiles(tiles: string[], fn: (tile: string, col: number, row: number) => any) {
  for (let row=0, k=tiles.length; row < k; row++) {
    for (let col=0, l=tiles[row].length; col < l; col++) {
      fn(tiles[row][col], col, row)
    }
  }
}

function drawDecorations(ctx: CanvasRenderingContext2D, tileSize: number, tiles: string[]) {
  mapTiles(tiles, (tile, col, row) => {
    const decoration = decorations.get(tile)
    if (decoration) {
      const image = getAsset<HTMLImageElement>(decoration)
      ctx.drawImage(image, col * tileSize, row * tileSize)
    }
  })
}

function drawWalls(ctx: CanvasRenderingContext2D, tileSize: number, tiles: string[]) {
  const wallsImage = getAsset<HTMLImageElement>('walls')
  const tilesPerRow = wallsImage.width / tileSize
  mapTiles(tiles, (tile, col, row) => {
    if (walls.includes(tile)) {
      const { x, y } = tileNumberToCoordinates(walls.indexOf(tile), tileSize, tilesPerRow)
      ctx.drawImage(
        wallsImage,
        x, y, tileSize, tileSize,
        col * tileSize, row * tileSize, tileSize, tileSize)
    }
  })
}

function createMapImage(map: Map) {
  const { tileSize, tiles } = map
  const floorImg = getAsset<HTMLImageElement>(map.floorAsset) as HTMLImageElement
  const canvas = document.createElement('canvas')
  canvas.width = tileSize * tiles[0].length
  canvas.height = tileSize * tiles.length
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  
  drawFloor(ctx, floorImg, canvas.width, canvas.height)
  drawDecorations(ctx, tileSize, tiles)
  drawWalls(ctx, tileSize, tiles)

  return canvas
}

let mapImage: HTMLCanvasElement, mapImageId: string
export function drawMap(map: Map, worldOffset: XYZ) {
  if (mapImageId != map.id) {
    mapImage = createMapImage(map)
    mapImageId = map.id
  }
  draw((ctx, cw, ch) => {
    ctx.drawImage(mapImage, worldOffset.x, worldOffset.y)
  })
}

function isWall(map: Map, x: number, y: number) {
  const tileX = x / map.tileSize
  const tileY = y / map.tileSize
  const tile = map.tiles[tileY][tileX]
  return walls.includes(tile)
}

export function buildPolygons(map: Map): Polygon[] {
  const result: Polygon[] = []
  mapTiles(map.tiles, (tile, col, row) => {
    const offset = xyz(col * map.tileSize, row * map.tileSize)
    const polygon = polygons.get(tile)
    if (polygon) {
      const image = getAsset<HTMLImageElement>(polygon)
      const points = textureToPolygon(image)
      const poly = points.map(p => add(offset, p))
      result.push(poly)
    }
  })
  return result
}

export function buildWallPolygons(map: Map): Polygon[] {
  let pols = [],
      w = map.tiles[0].length * map.tileSize,
      h = map.tiles.length * map.tileSize,
      tw = map.tileSize,
      th = map.tileSize,
      poly = null

  //horPass
  for(let y=th; y<h-th; y=y+th) {
    for(let x=tw; x<w-tw; x=x+tw) {
      let hit = isWall(map, x, y)
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
      let hit = isWall(map, x, y)
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

  return pols.map(p => p.map(({x, y}) => xyz(x, y)))
}