define([
  "resources", 
  "light", 
  "connection", 
  "decorations",
  "pills"], function(res, Light, Connection, decorations, pills) {

  var turnSpeed = 10,
      walkSpeed = 5,
      banzaiWalkSpeed = 4,
      wedgieDistance = 32,
      banzaiDistance = 48,
      banzaidDuration = 3500,
      wedgiedDuration = 3500,
      wedgieDirectionThreshold = 75, //255 max
      updateThreshold = 3 //every 30 frames
      hearingDistance = 200
      to_degrees = 180/Math.PI

      frameSequences = {
        stand: 0,
        banzaiStand: 1,
        blood: [0, 1, 2, 3, 4, 5, null],
        walk: [8, 8, 8, 9, 9, 9, 10, 10, 10, 9, 9, 9],
        banzaiWalk: [0, 0, 0, 1, 1, 1, 2, 2, 2, 1, 1, 1],
        walkPerformWedgie: [5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, null],
        performWedgie: [0, 0, 0, 1, 1, 1, 2, 2, 2, 1, 1, 1, 0, null],
        performBanzai: [0, 2, 3, 4, 3, 2, 1, 1, null],
        wedgie: [16, 17, 18, 19, 19, 20, 20, 20, 20, 20, null]
      },

      drawSizes = {
        blood: {w: 64, h: 64},
        normal: {w: 32, h: 32},
        banzaiWalk: {w: 64, h: 32},
        performBanzai: {w: 128, h: 64}
      },

      game = null

  function normalizeAngle(angle) {
    var result = angle
    while (result >= 360) result -= 360;
    while (result < 0) result += 360;
    return result
  }

  function angleDifference(a, b) {
    return Math.abs((normalizeAngle(a) + 180 - normalizeAngle(b)) % 360 - 180);
  }

  var Player = enchant.Class.create(enchant.Sprite, {
    
    initialize: function(color) {
      enchant.Sprite.call(this, 32, 32);
      game = game || enchant.Game.instance
      this.drawSize = drawSizes.normal
      this.color = color || "green"
      this._suffix = this.color[0].toUpperCase() + this.color.substr(1)
      this.image = game.assets[res["man" + this._suffix]]
      this.frame = frameSequences.stand
      this.addEventListener('enterframe', this.onEnterFrame)

      this.walksps = Math.ceil(game.fps/2)
      this.rotation = 0
      this.reset();
      this.w2 = Math.floor(this.width/2)
      this.h2 = Math.floor(this.height/2)
      this.cx = Math.floor(this.x + this.w2)
      this.cy = Math.floor(this.y + this.h2)      
      this.light = new Light(this)
      this.pillEffects = {}
      this.fxs = {}
    },

    reset: function() {
      this.walkSpeed = walkSpeed
      this.turnSpeed = turnSpeed
    },

    onEnterFrame: function () {
      this.checkUpdateThreshold()
      this.updateActionStatus()
      this.move()
      this.light.refresh()
      this.controls()
      this.updateFrameSet()
      this.emitChanges()
    }, 

    checkUpdateThreshold: function() {
      this.updateThreshold--
    },

    move: function() {
      this.rotV = 0

      if(this.banzaid)
        return

      if (game.input.left) {
        this.rotV = -1
        this.rotation -= this.turnSpeed
        this.shouldUpdate = true
      } else if (game.input.right) {
        this.rotV = 1
        this.rotation += this.turnSpeed
        this.shouldUpdate = true
      } 

      this.v = 0;
      if (game.input.up) {
        this.v = this.walkSpeed;
      } else if (game.input.down) {
        this.v = -this.walkSpeed/2;
      }

      if(game.autoPlay)
        this.autoPlay()

      if (this.v) {

        if(this.speedMultiplier) {
          this.v *= this.speedMultiplier
        }

        this._move()

        if(game.frame % Math.ceil(this.walksps/this.speedMultiplier) == 0)
          game.assets[res["walk" + Math.ceil(Math.random()*3)]].play(true)
      
        this.shouldUpdate = true

      }
    }, 

    _move: function() {
      //http://www.helixsoft.nl/articles/circle/sincos.htm
      
      var map = game.map,
          rot = normalizeAngle(this.rotation)

      rot = rot / 180 * Math.PI

      var velX = this.v * Math.cos(rot),
          velY = this.v * Math.sin(rot),
          oldX = this.x,
          oldY = this.y,
          x = this.x + velX,
          y = this.y + velY

      //collision rect
      //enchant.Game.instance.shadows.surface.context.fillRect(x, y, this.width, this.height)
      
      //keep in map and don't collide with walls
      if (map.isWithin(x, this.y, this.width, this.height) && 
          !map.collides(x, this.y, this.w2, this.h2)) {
        //don't collide with decorations
        this.x = x
        var collidingDecorations = this.intersect(decorations.Decoration)
        if(collidingDecorations && collidingDecorations.length > 0) {
          this.x = oldX          
        }
      }
      if (map.isWithin(this.x, y, this.width, this.height) && 
          !map.collides(this.x, y, this.w2, this.h2)) {
        this.y = y
        //don't collide with decorations
        var collidingDecorations = this.intersect(decorations.Decoration)
        if(collidingDecorations && collidingDecorations.length > 0) {
          this.y = oldY
        }
      }

      this.cx = Math.floor(this.x + this.w2)
      this.cy = Math.floor(this.y + this.h2)
    },

    controls: function() {
      
      if(!this.wedgied && game.input.aUp) {
        if(this.banzaiMode) {
          this.performBanzai()
        } 
        else {
          this.performWedgie()
        }
      }
      game.input.aUp = false

      if(!this.wedgied && game.input.bUp) {
        this.toggleBanzaiMode()
      }
      game.input.bUp = false

      if(game.input.leftUp
        || game.input.rightUp
        || game.input.upUp
        || game.input.downUp) {
        this.shouldUpdate = true
      }
      game.input.leftUp
      = game.input.rightUp
      = game.input.upUp
      = game.input.downUp = false
    },

    autoPlay: function() {
      this.v = Math.random() > 0 ? Math.random()*this.walkSpeed : 0
      this.rotV = Math.random() > 0.5 ? 1 : -1
    },

    updateFrameSet: function() {
      var fs = this.fs,
          img = this.image,
          drawSize = this.drawSize
      if(this.v) {

        if(this.banzaid) {
          fs = frameSequences.blood
          img = game.assets[res.blood]
          drawSize = drawSizes.blood
        } else if(this.wedgied) {
          fs = frameSequences.wedgie
          img = game.assets[res["man" + this._suffix]]
          drawSize = drawSizes.normal
        }
        else if(this.performingBanzai) {
          fs = frameSequences.performBanzai
          img = game.assets[res["man" + this._suffix + "PerformBanzai"]]
          drawSize = drawSizes.performBanzai
        } 
        else if(this.performingWedgie) {
          fs = frameSequences.walkPerformWedgie
          img = game.assets[res["man" + this._suffix]]
          drawSize = drawSizes.normal
        } 
        else if(this.banzaiMode) {
          fs = frameSequences.banzaiWalk
          img = game.assets[res["man" + this._suffix + "BanzaiWalk"]]
          drawSize = drawSizes.banzaiWalk
        } 
        else {
          fs = frameSequences.walk
          img = game.assets[res["man" + this._suffix]]
          drawSize = drawSizes.normal
        }

      } else {

        if(this.performingBanzai) {
          fs = frameSequences.performBanzai
          img = game.assets[res["man" + this._suffix + "PerformBanzai"]]
          drawSize = drawSizes.performBanzai
        }
        else if(this.banzaid) {
          fs = frameSequences.blood
          img = game.assets[res.blood]
          drawSize = drawSizes.blood
        }
        else if(this.wedgied) {
          fs = frameSequences.wedgie
          img = game.assets[res["man" + this._suffix]]
          drawSize = drawSizes.normal
        }
        else if(this.performingWedgie) {
          fs = frameSequences.performWedgie
          img = game.assets[res["man" + this._suffix]]
          drawSize = drawSizes.normal
        } 
        else if(this.banzaiMode) {
          fs = frameSequences.banzaiStand
          img = game.assets[res["man" + this._suffix + "BanzaiWalk"]]
          drawSize = drawSizes.banzaiWalk
        }
        else {
          fs = frameSequences.stand
          img = game.assets[res["man" + this._suffix]]
          drawSize = drawSizes.normal
        }

      }

      if(this.drawSize != drawSize) {
        this.drawSize = drawSize
      }
      if(this.fs != fs) {
        this.fs = fs
        this.frame = [].slice.call(fs)
        this.shouldUpdate = true
      }
      if(this.image != img) {
        this.image = img
      }
    },

    updateActionStatus: function() {
      if(this.performingWedgie && this._frameSequence.length == 0) {
        this.performingWedgie = false
      }
      if(this.performBanzai && this._frameSequence.length == 0) {
        this.performingBanzai = false
      }
      if(this.wedgied && this._frameSequence.length == 0) {
        /*
        setTimeout((function(entity) {
          return function() { entity.wedgied = false }
        })(this), wedgiedDuration)
        */
      }
      if(this.banzaid && this._frameSequence.length == 0) {
        /*
        setTimeout((function(entity) {
          return function() { entity.banzaid = false }
        })(this), banzaidDuration)
        */
      }
      if(this.performingBanzai && this.frame == 1) {
        this.performBanzaiHit()
      }
    },

    performWedgie: function() {
      if(this.performingWedgie) return;

      this.performingWedgie = true
      var enemies = game.players;
      
      for(var i in enemies) {
        var enemy = enemies[i]
        if(enemy.id != this.id) {
          
          if(!enemy.wedgied 
            && !enemy.banzaid
            && enemy.opacity > 0 
            && enemy.within(this, wedgieDistance)) {
            var rot = angleDifference(this.rotation, enemy.rotation)
            if(rot < wedgieDirectionThreshold) {
              enemy.wedgie()
            }
          }
        }
      }

      game.assets[res["performWedgie" + Math.ceil(Math.random()*4)]].play()
    },

    performBanzai: function() {
      if(this.performingBanzai) return;
      this.performingBanzai = true
      this.banzaiSoundPlayed = false
      this.shouldUpdate = true
    },

    performBanzaiHit: function() {
      var enemies = game.players;
      
      for(var i in enemies) {
        var enemy = enemies[i]
        if(enemy.id != this.id) {
          if(!enemy.banzaid
            && enemy.opacity > 0 
            && !enemy.pillEffects["red"]
            && enemy.within(this, banzaiDistance*Math.min(this.scaleX, 1.5))) {
            enemy.banzai()
          }
        }
      }

      if(!this.banzaiSoundPlayed) {
        game.assets[res["performBanzai" + Math.ceil(Math.random()*3)]].play()
        this.banzaiSoundPlayed = true
      }
    },

    toggleBanzaiMode: function() {
      this.banzaiMode = !this.banzaiMode
      if(this.banzaiMode) {
        this.walkSpeed = banzaiWalkSpeed
        game.assets[res["banzaiScream" + Math.ceil(Math.random()*3)]].play()
      } else {
        this.walkSpeed = walkSpeed
      }
      this.shouldUpdate = true
    },

    wedgie: function() {
      this.wedgied = true
      this.banzaiMode = false
      this.performingBanzai = false
      this.performingWedgie = false
      this.shouldUpdate = true
      game.assets[res["arrgh" + Math.ceil(Math.random()*4)]].play()
    },

    banzai: function() {
      this.v = this.rotV = 0
      this.banzaid = true
      this.banzaiMode = false
      this.performingBanzai = false
      this.performingWedgie = false
      this.shouldUpdate = true
      game.assets[res["arrgh" + Math.ceil(Math.random()*4)]].play()
    },

    consumePill: function(pill) {
      if(!this.pillEffects[pill.type]) {
        this.pillEffects[pill.type] = pill
        pill.applyEffect(this)        
      }

      if(pill.type == "green" && Math.random() > 0.75)
        game.assets[res.uliuliuli].play()
      else {
        var r = Math.ceil(Math.random()*3)
        game.assets[res["pill" + r]].play()
      }
    },

    clearPillEffect: function(type) {
      if(this.pillEffects[type]) {
        this.pillEffects[type].clearEffect(this)
        delete this.pillEffects[type]
      }
    },

    clearDeath: function(position) {
      this.banzaid = this.wedgied = false
      this.x = position.x
      this.y = position.y
      this._updateCoordinate()
      game.shadows.clearAll()
    },

    _setFrame: function(frame) {
      var image = this._image;
      var row, col;
      if (image != null) {
        this._frame = frame;
        row = image.width / this.drawSize.w | 0;
        this._frameLeft = (frame % row | 0) * this.drawSize.w;
        this._frameTop = (frame / row | 0) * this.drawSize.h % image.height;
      }
    },

    cvsRender: function(ctx) {
      var img, imgdata, row, frame;
      var sx, sy, sw, sh;
      if (this._image && this._width !== 0 && this._height !== 0) {
        frame = Math.abs(this._frame) || 0;
        img = this._image;
        imgdata = img._element;
        sx = this._frameLeft;
        sy = Math.min(this._frameTop, img.height - this.drawSize.h);
        sw = Math.min(img.width - sx, this.drawSize.w);
        sh = Math.min(img.height - sy, this.drawSize.h);
        dx = (this._width - this.drawSize.w) / 2
        dy = (this._height - this.drawSize.h) / 2
        ctx.drawImage(imgdata, sx, sy, sw, sh, dx, dy, this.drawSize.w, this.drawSize.h);
      }
    },

    status: function() {
      return {
        rotation: this.rotation,
        rotV: this.rotV,
        v: this.v,
        x: this.x,
        y: this.y,
        performingWedgie: this.performingWedgie,
        performingBanzai: this.performingBanzai,
        banzaiMode: this.banzaiMode
      }
    },

    update: function(status) {
      /*
      for(var type in status.pillEffects) {
        if(!this.pillEffects[type]) {
          this.pillEffects[type] = pills.apply(type, this)
        } else {

        }
      }
      */
      for(var i in status) {
        this[i] = status[i]
      }
      /*
      this.v = status.v <= maxv ? status.v : this.v;
      this.rotation = status.rotation
      this.x = status.x;
      this.y = status.y;
      this.isDead = status.isDead;
      if(status.isStriking && !this.isStriking) {
        this.counter = 0;
        this.isStriking = true;
      }
      */
        
    },

    emitChanges: function() {

      if(this.updateThreshold > 0)
        return

      if(this.shouldUpdate) {
        Connection.update(this.status());
        this.updateThreshold = updateThreshold
      }
      this.shouldUpdate = false
    },

    isInView: function(other) {
      var a = Math.atan2(other.cy - this.cy, other.cx - this.cx) * to_degrees
      return angleDifference(Math.min(this.rotation, a), Math.max(this.rotation, a)) <= this.light.angle2
    },

    remove: function() {
      if(this.light) {
        this.light.remove()
        this.light = null
      }
      enchant.Sprite.remove.call(this)
    }

  });

  var Enemy = enchant.Class.create(Player, {
    
    initialize: function(color) {
      enchant.Sprite.call(this, 32, 32);
      game = game || enchant.Game.instance
      this.drawSize = drawSizes.normal
      this.color = color || "green"
      this._suffix = this.color[0].toUpperCase() + this.color.substr(1)
      this.image = game.assets[res["man" + this._suffix]]
      this.frame = frameSequences.stand
      this.addEventListener('enterframe', this.onEnterFrame)
      
      this.opacity = 0
      this.rotation = 0
      this.walkSpeed = walkSpeed
      this.turnSpeed = turnSpeed
      this.w2 = Math.floor(this.width/2)
      this.h2 = Math.floor(this.height/2)

      this.x = game.width / 2 + 100
      this.y = game.height / 2

      this.pillEffects = {}
      this.fxs = {}
    },

    onEnterFrame: function () {
      this.updateActionStatus()
      this.updateVisibility()
      this.move()
      this.updateFrameSet()
    }, 

    move: function () {
      if(this.v) {
        this._move()

        if(game.player.within(this, hearingDistance)) {
          if(game.frame % Math.ceil(this.walksps/this.speedMultiplier) == 0) {
            game.assets[res["walk" + Math.ceil(Math.random()*3)]].play(true)
          }          
        }

      }
      if(this.rotV != 0) {
        this.rotation += this.rotV * turnSpeed
      }
      this.cx = Math.floor(this.x + this.w2)
      this.cy = Math.floor(this.y + this.h2)
    },

    updateVisibility: function() {
      if(game.shadows) {
        if(this.banzaiMode) {
          this.opacity = 1
        } else if(this.within(game.player, game.player.light.width)) {
          this.opacity = game.shadows.getOpacity(this) * 2.5
        } else {
          this.opacity = 0
        }
        if(this.opacity > 0 && this.opacity < 0.5)
          this.opacity = 0.5
      }
      if(this.fxs["green"]) this.fxs["green"].visible = this.opacity > 0
      if(this.fxs["red"]) this.fxs["red"].visible = this.opacity > 0
    },

    wedgie: function() {
      Player.prototype.wedgie.call(this)
      Connection.wedgie(this.id)
    },

    banzai: function() {
      Player.prototype.banzai.call(this)
      Connection.banzai(this.id)
    },

    consumePill: function(pill) {
      if(!this.pillEffects[pill.type]) {
        this.pillEffects[pill.type] = pill
        pill.applyEffect(this)        
      }
    },

    performBanzaiHit: function() {
      //nada
    }
  });

  return {
    Enemy: Enemy,
    Player: Player
  }

});