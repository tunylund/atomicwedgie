import { getAsset, AssetKey } from './assets'
import { draw, Entity, XYZ, frameSequence, FrameSequence } from 'tiny-game-engine/lib/index'
import { getShadowOpacity, ShadowCaster } from './shadows'
import { Effect } from './effects'

export const enum Modes {
  Stand = 'Stand',
  Walk = 'Walk',
  BanzaiStand = 'BanzaiStand',
  BanzaiWalk = 'BanzaiWalk',
  BanzaiAttack = 'BanzaiAttack',
  WedgieAttackStand = 'WedgieAttackStand',
  WedgieAttackWalk = 'WedgieAttackWalk',
  DeadByBanzai = 'DeadByBanzai',
  DeadByWedgie = 'DeadByWedgie',
  DeadByWedgieWalk = 'DeadByWedgieWalk'
}

export interface Player extends Entity {
  id: string
  name: string
  color: string
  mode: Modes
  modeCount: number
}

function drawPlayer({ id, pos, dir }: Player, worldOffset: XYZ) {
  const animation = playerAnimations.get(id)
  if (animation) {
    const {image, x, y, frameSize} = animation.frameSequence
    let dx = -frameSize.width/2
    let dy = -frameSize.height/2
  
    draw((ctx: CanvasRenderingContext2D) => {
      ctx.translate(worldOffset.x, worldOffset.y)
      ctx.translate(pos.cor.x, pos.cor.y)
      ctx.rotate(dir.radian)
      ctx.drawImage(image as HTMLImageElement,
        x, y, frameSize.width, frameSize.height,
        dx, dy, frameSize.width, frameSize.height)
    })
  }
}

export function drawPlayers(myId: string, players: Player[], worldOffset: XYZ, shadowCaster: ShadowCaster) {
  players
    .filter(player => player.id === myId || getShadowOpacity(player.pos.cor, shadowCaster) > 0)
    .map(player => drawPlayer(player, worldOffset))
}

function determineEffectiveFrameSequence(mode: Modes, color: string): FrameSequence {
  const normalImage = getAsset<HTMLImageElement>(`man-${color}` as AssetKey)
  const banzaiAttackImage = getAsset<HTMLImageElement>(`man-${color}-banzai` as AssetKey)
  const banzaiWalkImage = getAsset<HTMLImageElement>(`man-${color}-banzaiwalk` as AssetKey)
  const bloodImage = getAsset<HTMLImageElement>('blood')
  const normalFrameSize = { width: 32, height: 32 }
  const banzaiWalkFrameSize = { width: 64, height: 32 }
  const banzaiAttackFrameSize = { width: 128, height: 64 }
  const bloodFrameSize = { width: 64, height: 64 }

  if (mode === Modes.Stand) return frameSequence([0], 0, false, normalImage, normalFrameSize)
  if (mode === Modes.Walk) return frameSequence([8,9,10,9], 0.4, true, normalImage, normalFrameSize)
  if (mode === Modes.BanzaiStand) return frameSequence([1], 0, false, banzaiWalkImage, banzaiWalkFrameSize)
  if (mode === Modes.BanzaiWalk) return frameSequence([0,1,2,1], 0.4, true, banzaiWalkImage, banzaiWalkFrameSize)
  if (mode === Modes.BanzaiAttack) return frameSequence([0,2,3,4,2,1,1], 0.45, false, banzaiAttackImage, banzaiAttackFrameSize)
  if (mode === Modes.WedgieAttackStand) return frameSequence([0,1,2,1,0], 0.4, false, normalImage, normalFrameSize)
  if (mode === Modes.WedgieAttackWalk) return frameSequence([4,5,6,7,6,5], 0.4, false, normalImage, normalFrameSize)
  if (mode === Modes.DeadByBanzai) return frameSequence([0,1,2,3,4,5], 0.35, false, bloodImage, bloodFrameSize)
  if (mode === Modes.DeadByWedgie) return frameSequence([16, 17, 18, 19, 19, 20, 20, 20, 20, 20], 0.4, false, normalImage, normalFrameSize)
  if (mode === Modes.DeadByWedgieWalk) return frameSequence([20], 0, false, normalImage, normalFrameSize)
  return frameSequence([0], 0, true, normalImage, normalFrameSize)
}

interface PlayerAnimation {
  modeCount: number
  frameSequence: FrameSequence
}
const playerAnimations = new Map<string, PlayerAnimation>()
export function animatePlayers(players: Player[], step: number) {
  players.map(({id, mode, modeCount, color}) => {
    const animation = playerAnimations.get(id)
    if (animation && animation.modeCount === modeCount) {
      animation.frameSequence.step(step)
    } else {
      playerAnimations.set(id, {
        modeCount,
        frameSequence: determineEffectiveFrameSequence(mode, color)
      })
    }
  })
}