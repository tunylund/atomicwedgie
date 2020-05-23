import { getShadowOpacity, ShadowCaster } from "./shadows"
import { draw, xyz, XYZ, zero } from "tiny-game-engine/lib/index"

type Particle = number

function ring(age: number, minRadius = 18): Particle[] {
  return [minRadius + Math.cos(age * 10) * 0.5]
}

function drawRing(age: number, cor: XYZ, color: XYZ, worldOffset: XYZ) {
  const particles = ring(age)
  draw((ctx: CanvasRenderingContext2D) => {
    ctx.translate(cor.x + worldOffset.x, cor.y + worldOffset.y)
    for (let radius of particles) {
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius)
      gradient.addColorStop(0.7, `rgba(${color.x}, ${color.y}, ${color.z}, 0)`)
      gradient.addColorStop(0.85, `rgba(${color.x}, ${color.y}, ${color.z}, 1)`)
      gradient.addColorStop(1, `rgba(${color.x}, ${color.y}, ${color.z}, 0)`)
      ctx.beginPath()
      ctx.fillStyle = gradient
      ctx.arc(0, 0, radius, 0, Math.PI*2, false)
      ctx.fill()
    }
  })
}

function p(x: number) { return -Math.pow(x, 4) - Math.pow(x, 3) + 4 * Math.pow(x, 2) -x + 2 }
function pulses(age: number, seed: number): Particle[] {
  const minRadius = 7 + seed * 15
  const minX = -2.5
  const maxX = 1.5
  const range = maxX - minX
  const steps = range / 5
  return [
    minRadius + p((age + steps * 1) % range + minX),
    minRadius + p((age + steps * 2) % range + minX),
    minRadius + p((age + steps * 3) % range + minX),
    minRadius + p((age + steps * 4) % range + minX),
    minRadius + p((age + steps * 5) % range + minX)
  ]
}

function drawPulse(age: number, cor: XYZ, seed: number, color: XYZ, worldOffset: XYZ) {
  const particles = pulses(age, seed)
  draw((ctx: CanvasRenderingContext2D) => {
    ctx.translate(cor.x + worldOffset.x, cor.y + worldOffset.y)
    for (let radius of particles) {
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius)
      gradient.addColorStop(0.7, `rgba(${color.x}, ${color.y}, ${color.z}, 0)`)
      gradient.addColorStop(0.85, `rgba(${color.x}, ${color.y}, ${color.z}, 0.5)`)
      gradient.addColorStop(1, `rgba(${color.x}, ${color.y}, ${color.z}, 0)`)
      ctx.beginPath()
      ctx.fillStyle = gradient
      ctx.arc(0, 0, radius, 0, Math.PI*2, false)
      ctx.fill()
    }
  })
}

function trail(age: number, maxRadius: number): Particle[] {
  const fps = 60
  const increment = 1/3
  const times = age/fps + 1
  const value = maxRadius / (increment * times)
  return [value]
}

function drawTrail(age: number, cor: XYZ, color: XYZ, maxRadius: number, worldOffset: XYZ) {
  const particles = trail(age, maxRadius)
  draw((ctx: CanvasRenderingContext2D) => {
    ctx.translate(cor.x + worldOffset.x, cor.y + worldOffset.y)
    for (let radius of particles) {
      const opacity = radius
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius)
      gradient.addColorStop(0, `rgba(${color.x}, ${color.y}, ${color.z}, ${opacity})`)
      gradient.addColorStop(0.5, `rgba(${color.x}, ${color.y}, ${color.z}, ${opacity})`)
      gradient.addColorStop(1, `rgba(${color.x}, ${color.y}, ${color.z}, 0)`)
      ctx.fillStyle = gradient
      ctx.arc(0, 0, radius, 0, Math.PI*2, false)
      ctx.fill()
    }
  })
}


const enum EffectType {
  Ring, Pulse, Trail
}
export interface Effect {
  playerId: string
  cor: XYZ
  type: EffectType
  age: number
  color: XYZ
  value: number
  speed: number
}

function drawEffect({playerId, age, cor, type, value, color}: Effect, worldOffset: XYZ, shadowCaster: ShadowCaster, myId: string) {
  const opacity = getShadowOpacity(cor, shadowCaster) * 2.5
  if (opacity > 0 || playerId == myId) {
    if (type === EffectType.Ring) drawRing(age, cor, color, worldOffset)
    if (type === EffectType.Pulse) drawPulse(age, cor, value, color, worldOffset)
    if (type === EffectType.Trail) drawTrail(age, cor, color, value, worldOffset)
  }
}

export function buildRingEffect(playerId: string): Effect {
  return { playerId, cor: zero, age: 0, type: EffectType.Ring, value: 0, color: xyz(255, 0, 0), speed: 500 }
}

export function buildPulseEffect(playerId: string): Effect {
  return { playerId, cor: zero, age: 0, type: EffectType.Pulse, value: Math.random(), color: xyz(0, 255, 0), speed: 500 }
}

export function buildTrailEffect(playerId: string): Effect {
  return { playerId, cor: zero, age: 0, type: EffectType.Trail, value: 8, color: xyz(125, 255, 255), speed: 500 }
}

export function drawEffects(effects: Effect[], worldOffset: XYZ, shadowCaster: ShadowCaster, myId: string) {
  effects.map(effect => drawEffect(effect, worldOffset, shadowCaster, myId))
}
