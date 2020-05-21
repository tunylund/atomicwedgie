import { draw, Entity, XYZ } from "tiny-game-engine/lib/index"
import { getShadowOpacity, ShadowCaster } from "./shadows"
import { AssetKey, getAsset } from "./assets"

export interface Pill extends Entity {
  id: string
  asset: AssetKey
}

function drawPill(pill: Pill, worldOffset: XYZ, shadowCaster: ShadowCaster) {
  const opacity = getShadowOpacity(pill.pos.cor, shadowCaster) * 2.5
  const image = getAsset<HTMLImageElement>(pill.asset)
  if (opacity > 0) {
    draw((ctx: CanvasRenderingContext2D) => {
      ctx.translate(worldOffset.x, worldOffset.y)
      ctx.rotate(pill.dir.radian)
      ctx.globalAlpha = Math.max(opacity/100, 0.5)
      ctx.drawImage(image, pill.pos.cor.x, pill.pos.cor.y)
    }, pill.dim)
  }
}

export function drawPills(pills: Pill[], worldOffset: XYZ, shadowCaster: ShadowCaster) {
  pills.map(pill => drawPill(pill, worldOffset, shadowCaster))
}