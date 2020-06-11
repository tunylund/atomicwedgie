import { getAsset, AssetKey } from './assets'
import { draw, XYZ, frameSequence, FrameSequence, xyz } from 'tiny-game-engine/lib/index'
import { getShadowOpacity, ShadowCaster } from './shadows'
import { Player, Modes, EffectType } from '../../types/types'
import { drawRing, drawPulse, drawTrail } from './effects'
import { send } from 'shared-state-client/dist/index'

const red = xyz(255, 0, 0)
const green = xyz(0, 255, 0)
const blue = xyz(0, 0, 255)

function drawPlayer({ id, pos, dir, dim, effects }: Player, worldOffset: XYZ) {
  const animation = playerAnimations.get(id)
  if (animation) {
    const {image, x, y, frameSize} = animation.frameSequence
    let dx = -frameSize.width/2
    let dy = -frameSize.height/2

    effects.map(effect => {
      if (effect.type === EffectType.Red) drawRing(effect.duration, pos.cor, red, worldOffset)
      if (effect.type === EffectType.Green) drawPulse(effect.duration, pos.cor, green, worldOffset)
    })
    
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

function drawBlueEffect(players: Player[], myId: string, worldOffset: XYZ) {
  const blueEffect = players
    .find(p => p.id === myId)?.effects
    .find(effect => effect.type === EffectType.Blue)
  if (blueEffect) {
    players
      .filter(p => p.id !== myId)
      .map(player => drawTrail(blueEffect.duration, player.pos.cor, blue, worldOffset))
  }
}

export function getFlags({pos, mode}: Player) {
  const isMoving = pos.vel.size > 0
  const isAttacking = [
    Modes.BanzaiAttack,
    Modes.WedgieAttackStand,
    Modes.WedgieAttackWalk
  ].includes(mode)
  const isInBanzai = [
    Modes.BanzaiAttack,
    Modes.BanzaiStand,
    Modes.BanzaiWalk
  ].includes(mode)
  const isDeadByBanzai =[
    Modes.DeadByBanzai
  ].includes(mode)
  const isDeadByWedgie = [
    Modes.DeadByWedgie,
    Modes.DeadByWedgieWalk
  ].includes(mode)
  const isDead = [
    Modes.DeadByBanzai,
    Modes.DeadByWedgie,
    Modes.DeadByWedgieWalk
  ].includes(mode)
  return { isMoving, isAttacking, isInBanzai, isDeadByBanzai, isDeadByWedgie, isDead }
}

function isVisible(player: Player, myId: string, shadowCaster: ShadowCaster) {
  return player.id === myId
    || getShadowOpacity(player.pos.cor, shadowCaster) > 0
    || getFlags(player).isInBanzai
}

export function drawPlayers(myId: string, players: Player[], worldOffset: XYZ, shadowCaster: ShadowCaster) {
  drawBlueEffect(players, myId, worldOffset)

  players
    .filter(player => isVisible(player, myId, shadowCaster))
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
  players.map(player => {
    const animation = playerAnimations.get(player.id)

    if (animation && animation.modeCount === player.modeCount) {
      animation.frameSequence.step(step)
      if (getFlags(player).isAttacking && animation.frameSequence.finished) send('reset-attack')
    } else {
      playerAnimations.set(player.id, {
        modeCount: player.modeCount,
        frameSequence: determineEffectiveFrameSequence(player.mode, player.color)
      })
    }
  })
}