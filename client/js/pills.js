define(["resources", "connection", "particles"], function(res, Connection, particles) {

  var turnSpeed = 10

  var Pill = enchant.Class.create(enchant.Sprite, {

    initialize: function(pill) {
      enchant.Sprite.call(this, 32, 11);
      this.opacity = 0
      this.id = pill.id
      this.x = pill.x
      this.y = pill.y
      this.cx = Math.floor(this.x + this.width / 2)
      this.cy = Math.floor(this.y + this.height / 2)
      this.addEventListener("enterframe", this.onEnterFrame)
    },

    onEnterFrame: function() {
      this.updateVisibility()
      if(this.opacity > 0) {
        this.rotation += turnSpeed
      }
      if(this.intersect(enchant.Game.instance.player)) {
        Connection.consumePill(this)
      }
    },

    updateVisibility: function() {
      if(enchant.Game.instance.shadows) {
        if(this.within(game.player, game.player.light.width)) {
          this.opacity = game.shadows.getOpacity(this) * 2.5
        } else {
          this.opacity = 0
        }
        if(this.opacity > 0 && this.opacity < 0.5)
          this.opacity = 0.5
      }
    },

    applyEffect: function(player) {
    },

    clearEffect: function(player) {
      player.fxs[this.type].remove()
      delete player.fxs[this.type]
    }

  })

  var types = {
    red: enchant.Class.create(Pill, {
     
      initialize: function(pill) {
        Pill.call(this, pill);
        this.type = "red"
        this.color = {r: 255, g: 0, b: 0}
        this.image = enchant.Game.instance.assets[res.pillRed]
      },

      applyEffect: function(player) {
        var fx = new particles.Ring(player, this.color)
        fx.visible = player.opacity > 0
        enchant.Game.instance.playerStage.insertBefore(fx, player)
        player.fxs[this.type] = fx
      }

    }),
    green: enchant.Class.create(Pill, {
      initialize: function(pill) {
        Pill.call(this, pill);
        this.type = "green"
        this.color = {r: 0, g: 255, b: 0}
        this.image = enchant.Game.instance.assets[res.pillGreen]
      },
      applyEffect: function(player) {
        var fx = new particles.Pulse(player, this.color)
        fx.visible = player.opacity > 0
        enchant.Game.instance.playerStage.insertBefore(fx, player)
        player.fxs[this.type] = fx
        player.speedMultiplier = 1.5
      },
      clearEffect: function(player) {
        Pill.prototype.clearEffect.call(this, player)
        player.speedMultiplier = 1
      }
    }),
    blue: enchant.Class.create(Pill, {
      initialize: function(pill) {
        Pill.call(this, pill);
        this.type = "blue"
        this.color = {r: 45, g: 45, b: 255}
        this.image = enchant.Game.instance.assets[res.pillBlue]
      },

      applyEffect: function(player) {
        var game = enchant.Game.instance
        if(player.id != game.player.id) return

        for(var id in game.players) {
          if(id != player.id) {
            var enemy = game.players[id],
                fx = new particles.Trail(enemy, this.color)
            fx.visible = true
            enchant.Game.instance.playerStage.insertBefore(fx, enemy)
            enemy.fxs[this.type] = fx            
          }
        }
      },
      clearEffect: function(player) {
        var game = enchant.Game.instance
        if(player.id == game.player.id) {
          for(var id in game.players) {
            if(id != player.id) {
              var enemy = game.players[id]
              enemy.fxs[this.type].remove()
              delete enemy.fxs[this.type]
            }
          }          
        }

      }
    }),
    yellow: enchant.Class.create(Pill, {
      initialize: function(pill) {
        Pill.call(this, pill);
        this.type = "yellow"
        this.color = {r: 255, g: 255, b: 45}
        this.image = enchant.Game.instance.assets[res.pillYellow]
      },

      applyEffect: function(player) {
        var fx = new particles.Ring(player, this.color)
        fx.visible = player.opacity > 0
        enchant.Game.instance.playerStage.insertBefore(fx, player)
        player.fxs[this.type] = fx
        player.scaleX = 2
        player.scaleY = 2

      },
      clearEffect: function(player) {
        Pill.prototype.clearEffect.call(this, player)
        player.scaleX = 1
        player.scaleY = 1
      }
    })
  }

  return {
    create: function(pill) {
      return new types[pill.type](pill)
    }
  }

})