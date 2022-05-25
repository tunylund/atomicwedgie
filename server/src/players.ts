import { getSpawnPoint } from "./maps";
import { position, xyz, vector, move, vectorTo, zero, Entity, distance, Polygon, polygonCollidesWithPoint, polygonCollidesWithPolygon, collisionRect, circleCollidesWithPolygon, collisionCircle } from "tiny-game-engine";
import { Player, Map, Modes, Score, EffectType, Insult } from "../../types/types";
import { banzaid, quote, wedgied } from "./texts";

const turnSpeed = 6 / 1000,
      walkSpeed = 100 / 1000,
      banzaiWalkSpeed = 70 / 1000,
      banzaiDistance = 48,
      wedgieDistance = 32,
      minDistance = 12,
      banzaiAngle = 45,
      banzaidDuration = 5 * 1000,
      wedgiedDuration = 4 * 1000

export function buildScore({id, name}: Player): Score {
  return {
    id, name, score: 0, wedgieCount: 0, wedgiedCount: 0, banzaiCount: 0, banzaidCount: 0
  }
}

export interface Input {
  arrowUp: boolean
  arrowRight: boolean
  arrowDown: boolean
  arrowLeft: boolean
  attack: boolean,
  banzaiSwich: boolean
  resetAttack: boolean
}

const defaultInput = {
  arrowUp: false,
  arrowRight: false,
  arrowDown: false,
  arrowLeft: false,
  attack: false,
  banzaiSwich: false,
  resetAttack: false
}

export function movePlayer(player: Player, input: Input = defaultInput, collisionPolygons: Polygon[], step: number) {
  const { isDeadByBanzai, isInBanzai } = getFlags(player)

  if (isDeadByBanzai) {
    player.pos.vel = zero
  } else {
    const turn = input.arrowLeft ? -1 : input.arrowRight ? 1 : 0
    player.dir = turn === 0 ? player.dir : vector(player.dir.radian + turn * turnSpeed * step, 1)

    const baseSpeed = isInBanzai ? banzaiWalkSpeed : walkSpeed
    const speedMultiplier = player.effects.find(effect => effect.type === EffectType.Green) ? 1.5 : 1
    const speed = input.arrowUp ? baseSpeed : input.arrowDown ? -baseSpeed/2 : 0
    player.pos.vel = vector(player.dir.radian, speed * speedMultiplier)

    const {pos, dim, dir} = player
    const nextPos = move(pos, step)
    const nextX = position(xyz(nextPos.cor.x, pos.cor.y))
    const nextY = position(xyz(pos.cor.x, nextPos.cor.y))
    player.pos = position(xyz(
      collisionPolygons.find(p => circleCollidesWithPolygon(collisionCircle({pos: nextX, dim, dir}), p))
      ? pos.cor.x : nextPos.cor.x,
      collisionPolygons.find(p => circleCollidesWithPolygon(collisionCircle({pos: nextY, dim, dir}), p))
      ? pos.cor.y : nextPos.cor.y
    ), nextPos.vel, nextPos.acc)
  }
}

export function updateMode(player: Player, input: Input = defaultInput, step: number) {
  if (getFlags(player).isAttacking) player.attackDuration += step
  const mode = determineMode(player, input)
  if (mode !== player.mode) {
    player.mode = mode
    player.modeCount++
    if (getFlags(player).isAttacking) player.attackDuration = 0
  }

  input.attack = false
  input.banzaiSwich = false
}

export function hitOtherPlayers(player: Player, players: Player[], scores: Score[], insults: Insult[]) {
  const { isAttacking, isInBanzai } = getFlags(player)
  if (isAttacking && player.attackDuration < 1000) {
    if (isInBanzai) {
      if (player.attackDuration > 0.375 * 1000) {
        players.filter(other => (
          other.id !== player.id
          && !getFlags(other).isDead
          && !getFlags(other).isInvincible
          && Math.abs(vectorTo(player, other).angle - player.dir.angle) < banzaiAngle
          && distance(player, other) <= banzaiDistance
          && distance(player, other) > minDistance
        )).map(other => {
          other.deathTimeout = banzaidDuration
          other.mode = Modes.DeadByBanzai
          other.modeCount++
          scores.filter(s => s.id === other.id).map(s => s.banzaidCount++ )
          scores.filter(s => s.id === player.id).map(s => {
            s.banzaiCount++
            s.score += 2
          })
          insults.push({
            target: other.id,
            targetName: other.name,
            text: banzaid(player.name),
            quote: quote(),
            life: 5
          })
        })
        player.attackDuration = 2 * 1000
      }
    } else {
      players.filter(other => (
        other.id !== player.id
        && !getFlags(other).isDead
        && Math.abs(vectorTo(player, other).angle - player.dir.angle) < banzaiAngle
        && Math.abs(player.dir.angle - other.dir.angle) < banzaiAngle
        && distance(player, other) <= wedgieDistance
        && distance(player, other) > minDistance
      )).map(other => {
        other.deathTimeout = wedgiedDuration
        other.mode = Modes.DeadByWedgie
        other.modeCount++
        scores.filter(s => s.id === other.id).map(s => s.wedgiedCount++ )
        scores.filter(s => s.id === player.id).map(s => {
          s.wedgieCount++
          s.score += 5
        })
        insults.push({
          target: other.id,
          targetName: other.name,
          text: wedgied(player.name),
          quote: quote(),
          life: 5
        })
      })
      player.attackDuration = 2 * 1000
    }
  }
}

export function advanceEffects(player: Player, step: number) {
  player.effects = player.effects
    .map(effect => ({ ...effect, duration: effect.duration - step }))
    .filter(effect => effect.duration > 0)
}

export function advanceDeathTimer(player: Player, map: Map, collisionPolygons: Polygon[], step: number) {
  if (player.deathTimeout > 0) {
    player.deathTimeout -= step
    if (player.deathTimeout <= 0) {
      Object.assign(player, resetPlayer(player.id, player, map, collisionPolygons))
    }
  }
}

export function resetPlayer(id: string, {name, color}: {name: string, color: string}, map: Map, collisionPolygons: Polygon[]): Player {
  return {
    id,
    name,
    color,
    pos: position(getSpawnPoint(map, collisionPolygons, xyz(16, 16, 16))),
    dim: xyz(16, 16, 16),
    dir: vector(Math.PI * 2 * Math.random(), 1),
    mode: Modes.Stand,
    modeCount: 1,
    effects: [],
    deathTimeout: 0,
    attackDuration: 0
  }
}

function getFlags({pos, mode, effects, deathTimeout}: Player) {
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
  const isDead = deathTimeout > 0
  const isInvincible = !!effects.find(fx => fx.type == EffectType.Red)
  return { isMoving, isAttacking, isInBanzai, isDeadByBanzai, isDead, isInvincible }
}

function determineMode(player: Player, {attack, banzaiSwich, resetAttack}: Input): Modes {
  if (player.mode === Modes.DeadByBanzai) return player.mode

  const { isMoving, isAttacking, isInBanzai, isDeadByBanzai, isDead } = getFlags(player)
  const goToNormal = banzaiSwich && isInBanzai
  const goToBanzai = banzaiSwich && !isInBanzai
  const goToNotAttack = isAttacking && resetAttack
  if (isDead) {
    if (isDeadByBanzai) return Modes.DeadByBanzai
    else if (isMoving) return Modes.DeadByWedgieWalk
    else return Modes.DeadByWedgie
  } else if (isMoving) {
    if ((attack || isAttacking) && !goToNotAttack) {
      if (isInBanzai) return Modes.BanzaiAttack
      else return Modes.WedgieAttackWalk
    } else {
      if ((isInBanzai || goToBanzai) && !goToNormal) return Modes.BanzaiWalk
      else return Modes.Walk
    }
  } else if ((attack || isAttacking) && !goToNotAttack) {
    if (isInBanzai) return Modes.BanzaiAttack
    else return Modes.WedgieAttackStand
  } else {
    if ((isInBanzai || goToBanzai) && !goToNormal) return Modes.BanzaiStand
    else return Modes.Stand
  }
}
