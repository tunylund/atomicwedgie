function Particle(x, y, color, radius) {
  this.x = x || 0
  this.y = y || 0
  this.radius = radius || 10+Math.random()*20;
  this.life = 20+Math.random()*10 * 3;
  this.remainingLife = this.life;
  this.r = color ? color.r : Math.round(Math.random()*255);
  this.g = color ? color.g : Math.round(Math.random()*255);
  this.b = color ? color.b : Math.round(Math.random()*255);
}

class ParticleEmitter extends enchant.Entity {

  constructor () {
    super()
    this.particles = []
    this.visible = true
    this.addEventListener("enterframe", this.onEnterFrame)
  }
  onEnterFrame () { }
  cvsRender (context) { }
}

class Trail extends ParticleEmitter {

  get maxRadius() { return 30 }
  get birthFps() { return 5*3 }
  get maxParticles() { return 5 }

  constructor (player, color) {
    super()
    this.player = player
    this.f = 0
    this.color = color || {r: 0, g: 0, b: 255}
  }

  onEnterFrame () {
    this.x = this.player.x
    this.y = this.player.y
    this.f++
    if(this.f > this.birthFps && this.particles.length < this.maxParticles) {
      this.particles.push(new Particle(
        Math.random()*this.player.width, 
        Math.random()*this.player.height, 
        this.color
      ))
      this.f = 0
    }
  }

  cvsRender (context) {
    if(!this.visible) return

    context.save()
    //context.globalCompositeOperation = "lighter";

    for(let i=0, l=this.particles.length; i<l; i++) {
      const p = this.particles[i];
      context.beginPath();
      p.opacity = Math.round(p.remainingLife/p.life*100)/100
      const gradient = context.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
      gradient.addColorStop(0, "rgba("+p.r+", "+p.g+", "+p.b+", "+p.opacity+")");
      gradient.addColorStop(0.5, "rgba("+p.r+", "+p.g+", "+p.b+", "+p.opacity+")");
      gradient.addColorStop(1, "rgba("+p.r+", "+p.g+", "+p.b+", 0)");
      context.fillStyle = gradient;
      context.arc(p.x, p.y, p.radius, Math.PI*2, false);
      context.fill();
      
      //lets move the particles
      p.remainingLife--;
      p.radius--;
      
      //regenerate particles
      if(p.remainingLife < 0 || p.radius < 0) {
        this.particles.splice(i, 1)
        i--
        l--
      }
    }
    context.restore()
  }

}

class Pulse extends ParticleEmitter {

  get maxRadius() { return 30 }
  get birthFps() { return 1*6 }
  get maxParticles() { return 5 }

  constructor (player, color) {
    super()
    this.player = player
    this.f = 0
    this.color = color || {r: 0, g: 0, b: 255}
  }

  onEnterFrame () {
    this.x = this.player.x
    this.y = this.player.y
    this.f++
    if(this.f > this.birthFps && this.particles.length < this.maxParticles) {
      this.particles.push(new Particle(
        this.player.w2, 
        this.player.h2, 
        this.color
      ))
      this.f = 0
    }
  }

  cvsRender (context) {
    if(!this.visible) return

    context.save()
    //context.globalCompositeOperation = "lighter";

    for(let i=0, l=this.particles.length; i<l; i++) {
      const p = this.particles[i];
      context.beginPath();
      //changing opacity according to the life.
      //opacity goes to 0 at the end of life of a particle
      const gradient = context.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
      gradient.addColorStop(0.7, "rgba("+p.r+", "+p.g+", "+p.b+", 0)");
      gradient.addColorStop(0.85, "rgba("+p.r+", "+p.g+", "+p.b+", 0.5)");
      gradient.addColorStop(1, "rgba("+p.r+", "+p.g+", "+p.b+", 0)");
      context.fillStyle = gradient
      context.arc(p.x, p.y, p.radius, Math.PI*2, false);
      context.fill();
      
      //lets move the particles
      p.remainingLife--;
      p.radius = p.radius + 1/3;
      
      //regenerate particles
      if(p.remainingLife < 0 || p.radius > this.maxRadius) {
        this.particles.splice(i, 1)
        i--
        l--
      }
    }
    context.restore()
  }

}

class Ring extends ParticleEmitter {

  get maxRadius() { return 20 }
  get minRadius() { return 18 }
  get birthFps() { return 1*6 }
  get maxParticles() { return 1 }

  constructor (player, color) {
    super()
    this.player = player
    this.f = 0
    this.color = color || {r: 0, g: 0, b: 255}
  }

  onEnterFrame () {
    this.x = this.player.x
    this.y = this.player.y
    this.f++
    if(this.f > this.birthFps && this.particles.length < this.maxParticles) {
      const p = new Particle(
        this.player.w2, 
        this.player.h2, 
        this.color,
        this.minRadius
      )
      p.direction = 1
      this.particles.push(p)
      this.f = 0
    }
  }

  cvsRender (context) {
    if(!this.visible) return

    context.save()
    //context.globalCompositeOperation = "lighter";

    for(let i=0, l=this.particles.length; i<l; i++) {
      const p = this.particles[i];
      context.beginPath();
      //changing opacity according to the life.
      //opacity goes to 0 at the end of life of a particle
      const gradient = context.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
      gradient.addColorStop(0.7, "rgba("+p.r+", "+p.g+", "+p.b+", 0)");
      gradient.addColorStop(0.85, "rgba("+p.r+", "+p.g+", "+p.b+", 1)");
      gradient.addColorStop(1, "rgba("+p.r+", "+p.g+", "+p.b+", 0)");
      context.fillStyle = gradient
      //a gradient instead of white fill
      context.arc(p.x, p.y, p.radius, Math.PI*2, false);
      context.fill();
      
      //lets move the particles
      p.radius += p.direction/3;
      
      //regenerate particles
      if(p.radius > this.maxRadius || p.radius < this.minRadius) {
        p.direction*=-1
      }
    }
    context.restore()
  }

}

export { Trail, Pulse, Ring }
