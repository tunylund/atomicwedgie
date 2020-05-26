import { draw, XYZ } from 'tiny-game-engine/lib/index'
import { getAsset, AssetKey } from './assets'
import { Map } from '../../types/types'

function tileNumberToCoordinates(tile: number, tileSize: number, tilesPerRow: number) {
  const row = Math.floor(tile / tilesPerRow) * tileSize
  const col = (tile % tilesPerRow) * tileSize
  return { y: row, x: col }
}

function drawFloor(ctx: CanvasRenderingContext2D, floorImage: HTMLImageElement, w: number, h: number) {
  ctx.fillStyle = ctx.createPattern(floorImage, 'repeat') as CanvasPattern
  ctx.fillRect(0, 0, w, h)
}

function mapTiles(tiles: string[], fn: (tile: string, col: number, row: number) => any) {
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

export function isSolid(map: Map, x: number, y: number) {
  const tileX = x / map.tileSize
  const tileY = y / map.tileSize
  const tile = map.tiles[tileY][tileX]
  return walls.includes(tile) ||
    decorations.has(tile) || 
    decorations_.includes(tile)
}


export function isShadowCasting(map: Map, x: number, y: number) {
  const tileX = x / map.tileSize
  const tileY = y / map.tileSize
  const tile = map.tiles[tileY][tileX]
  return walls.includes(tile) ||
    bigDecorations.includes(tile) || 
    bigDecorations_.includes(tile)
}

const walls = [ ',', '.', '-', '|', '|', ';', ':' ]
const bigDecorations = [ 'Z', 'X', 'O']
const bigDecorations_ = [ 'Z', 'X', 'O'].map(s => s.toLowerCase())

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
const decorations_ = Array.from(decorations.keys()).map(c => c.toLowerCase())
