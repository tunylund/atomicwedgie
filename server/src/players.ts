import { getSpawnPoint } from "./maps";
import { position, xyz, vector, move, vectorTo, zero, bump, Entity, distance, isAt, intersects, mul } from "tiny-game-engine";
import { Player, Map, Modes, Score, GameState, EffectType } from "../../types/types";

const turnSpeed = 6,
      walkSpeed = 100,
      banzaiWalkSpeed = 70,
      banzaiDistance = 48,
      wedgieDistance = 32,
      banzaiAngle = 90,
      banzaidDuration = 3500,
      wedgiedDuration = 3500

export function buildScore({ id, name }: Player): Score {
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

export function movePlayer(player: Player, input: Input = defaultInput, walls: Entity[], step: number) {
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
      (walls.find(w => intersects(w, {pos: nextX, dim, dir}))) ? pos.cor.x : nextPos.cor.x,
      (walls.find(w => intersects(w, {pos: nextY, dim, dir}))) ? pos.cor.y : nextPos.cor.y,
    ), nextPos.vel, nextPos.acc)
  }
}

export function updateMode(player: Player, input: Input = defaultInput) {
  const { isAttacking } = getFlags(player)
  const mode = determineMode(player, input)
  if (mode !== player.mode) {
    player.mode = mode
    player.modeCount++
    player.isFreshAttack = !isAttacking && getFlags(player).isAttacking
  }

  input.attack = false
  input.banzaiSwich = false
}

export function hitOtherPlayers(player: Player, players: Player[]) {
  const { isAttacking, isInBanzai } = getFlags(player)
  if (player.isFreshAttack && isAttacking) {
    if (isInBanzai) {
      players
        .filter(other => {
          other.id !== player.id
          && !getFlags(other).isDead
          && !other.effects.find(fx => fx.type == EffectType.Red)
          && vectorTo(player, other).angle - player.dir.angle < banzaiAngle
          && distance(player, other) <= banzaiDistance
        })
        .map(other => {
          other.deathTimeout = banzaidDuration
          other.mode = Modes.DeadByBanzai
          other.modeCount++
        })
    } else {
      players
        .filter(other => {
          other.id !== player.id
          && !getFlags(other).isDead
          && vectorTo(player, other).angle - player.dir.angle < banzaiAngle
          && distance(player, other) <= wedgieDistance
        })
        .map(other => {
          other.deathTimeout = wedgiedDuration
          other.mode = Modes.DeadByWedgie
          other.modeCount++
        })
    }
  }
}

export function advanceEffects(player: Player, step: number) {
  player.effects = player.effects
    .map(effect => ({ ...effect, duration: effect.duration - step }))
    .filter(effect => effect.duration > 0)
}

export function advanceDeathTimer(player: Player, map: Map, step: number) {
  if (player.deathTimeout > 0) {
    player.deathTimeout -= step
    if (player.deathTimeout <= 0) {
      Object.assign(player, resetPlayer(player, map))
    }
  }
}

export function resetPlayer(player: Partial<Player>, map: Map): Player {
  return {
    ...player,
    pos: position(getSpawnPoint(map)),
    dim: xyz(32, 32, 32),
    dir: vector(Math.PI * 2 * Math.random(), 1),
    mode: Modes.Stand,
    modeCount: 1,
    moveSpeed: walkSpeed,
    effects: []
  } as Player
}

function getFlags({pos, mode}: Player) {
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
  const isDead = [
    Modes.DeadByBanzai,
    Modes.DeadByWedgie,
    Modes.DeadByWedgieWalk
  ].includes(mode)
  return { isMoving, isAttacking, isInBanzai, isDeadByBanzai, isDead }
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
