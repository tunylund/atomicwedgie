import resources from './resources.mjs'
import Connection from './connection.mjs'
import { Trail, Pulse, Ring } from './particles.mjs'

const turnSpeed = 10 / 3

class Pill extends enchant.Sprite {

  constructor (pill) {
    super(32, 11)
    this.opacity = 0
    this.id = pill.id
    this.x = pill.x
    this.y = pill.y
    this.cx = Math.floor(this.x + this.width / 2)
    this.cy = Math.floor(this.y + this.height / 2)
    this.addEventListener("enterframe", this.onEnterFrame)
  }

  onEnterFrame () {
    this.updateVisibility()
    if(this.opacity > 0) {
      this.rotation += turnSpeed
    }
    if(this.intersect(enchant.Game.instance.player)) {
      Connection.consumePill(this)
    }
  }

  updateVisibility () {
    const game = enchant.Game.instance
    if(game.shadows && game.player) {
      if(this.within(game.player, game.player.light.width)) {
        this.opacity = game.shadows.getOpacity(this) * 2.5
      } else {
        this.opacity = 0
      }
      if(this.opacity > 0 && this.opacity < 0.5)
        this.opacity = 0.5
    }
  }

  applyEffect (player) { }

  clearEffect (player) {
    player.fxs[this.type].remove()
    delete player.fxs[this.type]
  }

}

class Red extends Pill {
  constructor (pill) {
    super(pill)
    this.type = "red"
    this.color = {r: 255, g: 0, b: 0}
    this.image = enchant.Game.instance.assets[resources.pillRed]
  }

  applyEffect (player) {
    var fx = new Ring(player, this.color)
    fx.visible = player.opacity > 0
    enchant.Game.instance.playerStage.insertBefore(fx, player)
    player.fxs[this.type] = fx
  }
}

class Green extends Pill {
  constructor (pill) {
    super(pill)
    this.type = "green"
    this.color = {r: 0, g: 255, b: 0}
    this.image = enchant.Game.instance.assets[resources.pillGreen]
  }
  applyEffect (player) {
    const fx = new Pulse(player, this.color)
    fx.visible = player.opacity > 0
    enchant.Game.instance.playerStage.insertBefore(fx, player)
    player.fxs[this.type] = fx
    player.speedMultiplier = 1.5
  }
  clearEffect (player) {
    Pill.prototype.clearEffect.call(this, player)
    player.speedMultiplier = 1
  }
}

class Blue extends Pill {
  constructor (pill) {
    super(pill)
    this.type = "blue"
    this.color = {r: 45, g: 45, b: 255}
    this.image = enchant.Game.instance.assets[resources.pillBlue]
  }

  applyEffect (player) {
    const game = enchant.Game.instance
    if(player.id != game.player.id) return

    for(let id in game.players) {
      if(id != player.id) {
        const enemy = game.players[id],
            fx = new Trail(enemy, this.color)
        fx.visible = true
        enchant.Game.instance.playerStage.insertBefore(fx, enemy)
        enemy.fxs[this.type] = fx            
      }
    }
  }

  clearEffect (player) {
    const game = enchant.Game.instance
    if(player.id == game.player.id) {
      for(let id in game.players) {
        if(id != player.id) {
          const enemy = game.players[id]
          enemy.fxs[this.type].remove()
          delete enemy.fxs[this.type]
        }
      }          
    }

  }
}

class Yellow extends Pill {
  constructor (pill) {
    super(pill)
    this.type = "yellow"
    this.color = {r: 255, g: 255, b: 45}
    this.image = enchant.Game.instance.assets[resources.pillYellow]
  }

  applyEffect (player) {
    const fx = new Ring(player, this.color)
    fx.visible = player.opacity > 0
    enchant.Game.instance.playerStage.insertBefore(fx, player)
    player.fxs[this.type] = fx
    player.scaleX = 2
    player.scaleY = 2
  }

  clearEffect (player) {
    Pill.prototype.clearEffect.call(this, player)
    player.scaleX = 1
    player.scaleY = 1
  }
}

const types = {
  red: Red,
  green: Green,
  blue: Blue,
  yellow: Yellow
}

export default function createPill(pill) {
  return new types[pill.type](pill)
}