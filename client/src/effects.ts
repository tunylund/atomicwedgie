import { draw, XYZ } from "tiny-game-engine/lib/index"

type Particle = number

function ring(age: number, minRadius = 18): Particle[] {
  return [minRadius + Math.cos(age * 10) * 0.5]
}

export function drawRing(age: number, cor: XYZ, color: XYZ, worldOffset: XYZ) {
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
function pulses(age: number): Particle[] {
  const minRadius = 7
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

export function drawPulse(age: number, cor: XYZ, color: XYZ, worldOffset: XYZ) {
  const particles = pulses(age)
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

function trail(age: number): Particle[] {
  const fps = 60
  const increment = 1/3
  const times = age/fps + 1
  const value = 4 / (increment * times)
  return [value]
}

export function drawTrail(age: number, cor: XYZ, color: XYZ, worldOffset: XYZ) {
  const particles = trail(age)
  draw((ctx: CanvasRenderingContext2D) => {
    ctx.translate(cor.x + worldOffset.x, cor.y + worldOffset.y)
    for (let radius of particles) {
      const opacity = 0.5
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
