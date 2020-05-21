import { getShadowOpacity, ShadowCaster } from "./shadows"
import { draw, xyz, XYZ, add } from "tiny-game-engine/lib/index"

type Particle = number

function ring(age: number, minRadius = 18): Particle[] {
  const fps = 60
  const increment = 1/3
  const times = age/fps
  const rangeLimit = 2
  const cycle = Math.floor(increment * times / rangeLimit) % 2 == 0 ? 1 : -1
  const value = minRadius + cycle * (increment * times % rangeLimit)
  return [value]
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

function pulses(age: number, seed: number): Particle[] {
  const fps = 60
  const maxRadius = 30
  const birthFps = 6
  const minRadius = 10 + seed * 15
  const increment = 1/3
  const rangeLimit = maxRadius - minRadius
  return [
    minRadius + (increment * ((age + birthFps * 1)/fps) % rangeLimit),
    minRadius + (increment * ((age + birthFps * 2)/fps) % rangeLimit),
    minRadius + (increment * ((age + birthFps * 3)/fps) % rangeLimit),
    minRadius + (increment * ((age + birthFps * 4)/fps) % rangeLimit),
    minRadius + (increment * ((age + birthFps * 5)/fps) % rangeLimit)
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
  cor: XYZ
  type: EffectType
  age: number
  color: XYZ
  value: number
}

function drawEffect({age, cor, type, value, color}: Effect, worldOffset: XYZ, shadowCaster: ShadowCaster) {
  const opacity = getShadowOpacity(cor, shadowCaster) * 2.5
  if (opacity > 0) {
    if (type === EffectType.Ring) drawRing(age, cor, color, worldOffset)
    if (type === EffectType.Pulse) drawPulse(age, cor, value, color, worldOffset)
    if (type === EffectType.Trail) drawTrail(age, cor, color, value, worldOffset)
  }
}

export function buildRingEffect(cor: XYZ): Effect {
  return { cor, age: 0, type: EffectType.Ring, value: 0, color: xyz(255, 0, 0) }
}

export function buildPulseEffect(cor: XYZ): Effect {
  return { cor, age: 0, type: EffectType.Pulse, value: Math.random(), color: xyz(0, 255, 0) }
}

export function buildTrailEffect(cor: XYZ): Effect {
  return { cor, age: 0, type: EffectType.Trail, value: 8, color: xyz(125, 255, 255) }
}

export function drawEffects(effects: Effect[], worldOffset: XYZ, shadowCaster: ShadowCaster) {
  effects.map(effect => drawEffect(effect, worldOffset, shadowCaster))
}
