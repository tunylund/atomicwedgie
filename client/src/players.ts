import { getAsset, AssetKey } from './assets'
import { draw, Entity, XYZ } from 'tiny-game-engine/lib/index'
import { getShadowOpacity, ShadowCaster } from './shadows'

function computeImagePosition(asset: AssetKey, frame: number, drawSize: XYZ) {
  let image = getAsset<HTMLImageElement>(asset)
  const row = image.width / drawSize.x | 0
  return {
    image,
    sourceX: (frame % row | 0) * drawSize.x,
    sourceY: (frame / row | 0) * drawSize.y % image.height
  }
}

export interface Player extends Entity {
  id: string
  visible: boolean
  color: string
  drawSize: XYZ
  frame: number
  asset: AssetKey
}

function drawPlayer({ pos, dir, dim, asset, drawSize, frame }: Player, worldOffset: XYZ) {
  let { image, sourceX, sourceY } = computeImagePosition(asset, frame, drawSize)
  let ih = image.height
  let iw = image.width
  let sx = sourceX
  let sy = Math.min(sourceY, ih - drawSize.y)
  let sw = Math.min(iw - sx, drawSize.x)
  let sh = Math.min(ih - sy, drawSize.y)
  let dx = -dim.x2
  let dy = -dim.y2

  draw((ctx: CanvasRenderingContext2D) => {
    ctx.translate(worldOffset.x, worldOffset.y)
    ctx.translate(pos.cor.x, pos.cor.y)
    ctx.rotate(dir.radian)
    ctx.drawImage(image,
      sx, sy, sw, sh,
      dx, dy, dim.x, dim.y)
  })
}

export function drawPlayers(myId: string, players: Player[], worldOffset: XYZ, shadowCaster: ShadowCaster) {
  players
    .filter(player => player.id === myId || getShadowOpacity(player.pos.cor, shadowCaster) > 0)
    .map(player => drawPlayer(player, worldOffset))
}