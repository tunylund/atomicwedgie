define([
  "resources", 
  "light", 
  "connection", 
  "decorations",
  "pills"], function(res, Light, Connection, decorations, pills) {

  // /3 because fps was tripled
  const turnSpeed = 10 / 3,
        walkSpeed = 6 / 3,
        banzaiWalkSpeed = 4 / 3,
        wedgieDistance = 32,
        banzaiDistance = 48,
        wedgieDirectionThreshold = 125, //255 max
        updateThreshold = 3 * 3, //every 30 frames
        hearingDistance = 200,
        to_degrees = 180/Math.PI,

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
        }

  // triple animation durations because fps was tripled
  for (let name in frameSequences) {
    if (frameSequences[name].map) {
      frameSequences[name] = frameSequences[name]
      .map(frame => frame != null ? [frame, frame, frame] : [frame])
      .reduce((memo, frames) => memo.concat(frames), [])
    }
  }

  let game = null

  function normalizeAngle(angle) {
    let result = angle
    while (result >= 360) result -= 360;
    while (result < 0) result += 360;
    return result
  }

  function angleDifference(a, b) {
    return Math.abs((normalizeAngle(a) + 180 - normalizeAngle(b)) % 360 - 180);
  }

  class Player extends enchant.Sprite {
    
    constructor (color) {
      super(32, 32)
      game = game || enchant.Game.instance
      this.drawSize = drawSizes.normal
      this.color = color || "green"
      this._suffix = this.color[0].toUpperCase() + this.color.substr(1)
      this.image = game.assets[res["man" + this._suffix]]
      this.frame = frameSequences.stand
      this.addEventListener('enterframe', this.onEnterFrame)
      this.addEventListener(enchant.Event.ANIMATION_END, this.endAnimation)

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
    }

    reset () {
      this.walkSpeed = walkSpeed
      this.turnSpeed = turnSpeed
      enchant.Game.instance.shadows.clearAll()
    }

    onEnterFrame () {
      this.checkUpdateThreshold()
      this.updateActionStatus()
      if(game.autoPlay)
        this.autoPlay()
      else
        this.move()
      this.light.refresh()
      this.controls()
      this.updateFrameSet()
      this.emitChanges()
    } 

    checkUpdateThreshold () {
      this.updateThreshold--
    }

    move () {
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

      if (this.v) {

        this._move()
        
        if(game.frame % Math.ceil(this.walksps/this.speedMultiplier) == 0)
          game.assets[res["walk" + Math.ceil(Math.random()*3)]].play(true)
      
        this.shouldUpdate = true

      }
    }

    _move () {
      //http://www.helixsoft.nl/articles/circle/sincos.htm
      
      let map = game.map,
          rot = normalizeAngle(this.rotation),
          decorations = game.decorations.childNodes

      if (!map) return

      if(this.speedMultiplier) {
        this.v *= this.speedMultiplier
      }

      rot = rot / 180 * Math.PI

      let velX = this.v * Math.cos(rot),
          velY = this.v * Math.sin(rot),
          oldX = this.x,
          oldY = this.y,
          x = this.x + velX,
          y = this.y + velY

      //keep in map and don't collide with walls
      if (map.isWithin(x, this.y, this.width, this.height) && 
          !map.collides(x, this.y, this.w2, this.h2)) {
        //don't collide with decorations
        this.x = x
        if(decorations.filter(d => this.intersect(d)).length > 0) {
          this.x = oldX
        }
      }
      if (map.isWithin(this.x, y, this.width, this.height) && 
          !map.collides(this.x, y, this.w2, this.h2)) {
        this.y = y
        //don't collide with decorations
        if(decorations.filter(d => this.intersect(d)).length > 0) {
          this.y = oldY
        }
      }

      this.cx = Math.floor(this.x + this.w2)
      this.cy = Math.floor(this.y + this.h2)
    }

    controls () {
      
      if(!this.wedgied && game.input.aUp) {
        if(this.banzaiMode) {
          this.performBanzai()
        } else if(!this.banzaiMode) {
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
    }

    autoPlay () {
      this.v = Math.random() > 0 ? Math.random()*this.walkSpeed : 0
      if (Math.random() > 0.5) {
        this.rotation += this.turnSpeed
        this.rotV = 1
      } else {
        this.rotation -= this.turnSpeed
        this.rotV = -1
      }
      this._move()
    }

    updateFrameSet () {
      let fs = this.fs,
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
        } else if(this.banzaid) {
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
        this.fs = this.frame = fs
        this.shouldUpdate = true
      }
      if(this.image != img) {
        this.image = img
      }
    }

    endAnimation () {
      this.performingWedgie = false
      this.performingBanzai = false
    }

    updateActionStatus () {
      if (this.performingWedgie && this._frameSequence === null) {
        this.performingWedgie = false
      }
      if (this.performingBanzai && this._frameSequence === null) {
        this.performingBanzai = false
      }
      if(this.performingBanzai && this.frame == 1) {
        this.performBanzaiHit()
      }
    }

    performWedgie () {
      if(this.performingWedgie) return;

      this.performingWedgie = true
      let enemies = game.players;
      
      for(let i in enemies) {
        let enemy = enemies[i]
        if(enemy.id != this.id) {
          
          if(!enemy.wedgied 
            && !enemy.banzaid
            && enemy.opacity > 0 
            && enemy.within(this, wedgieDistance)) {
            let rot = angleDifference(this.rotation, enemy.rotation)
            if(rot < wedgieDirectionThreshold) {
              enemy.wedgie()
            }
          }
        }
      }

      game.assets[res["performWedgie" + Math.ceil(Math.random()*4)]].play()
    }

    performBanzai () {
      if(this.performingBanzai) return;
      this.performingBanzai = true
      this.banzaiSoundPlayed = false
      this.shouldUpdate = true
    }

    performBanzaiHit () {
      let enemies = game.players;
      
      for(let i in enemies) {
        let enemy = enemies[i]
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
    }

    toggleBanzaiMode () {
      this.banzaiMode = !this.banzaiMode
      if(this.banzaiMode) {
        this.walkSpeed = banzaiWalkSpeed
        game.assets[res["banzaiScream" + Math.ceil(Math.random()*3)]].play()
      } else {
        this.walkSpeed = walkSpeed
      }
      this.shouldUpdate = true
    }

    wedgie () {
      this.wedgied = true
      this.banzaiMode = false
      this.performingBanzai = false
      this.performingWedgie = false
      this.shouldUpdate = true
      game.assets[res["arrgh" + Math.ceil(Math.random()*4)]].play()
      for (let type in this.pillEffects) {
        this.clearPillEffect(type)
      }
    }

    banzai () {
      this.v = this.rotV = 0
      this.banzaid = true
      this.banzaiMode = false
      this.performingBanzai = false
      this.performingWedgie = false
      this.shouldUpdate = true
      game.assets[res["arrgh" + Math.ceil(Math.random()*4)]].play()
      for (let type in this.pillEffects) {
        this.clearPillEffect(type)
      }
    }

    consumePill (pill) {
      if(!this.pillEffects[pill.type]) {
        this.pillEffects[pill.type] = pill
        pill.applyEffect(this)        
      }

      if(pill.type == "green" && Math.random() > 0.75)
        game.assets[res.uliuliuli].play()
      else {
        let r = Math.ceil(Math.random()*3)
        game.assets[res["pill" + r]].play()
      }
    }

    clearPillEffect (type) {
      if(this.pillEffects[type]) {
        this.pillEffects[type].clearEffect(this)
        delete this.pillEffects[type]
      }
    }

    clearDeath (position) {
      this.banzaid = this.wedgied = false
      this.x = position.x
      this.y = position.y
      this._updateCoordinate()
      game.shadows.clearAll()
    }

    _computeFramePosition () {
      let image = this._image;
      let row;
      if (image != null) {
        row = image.width / this.drawSize.w | 0;
        this._frameLeft = (this._frame % row | 0) * this.drawSize.w;
        this._frameTop = (this._frame / row | 0) * this.drawSize.h % image.height;
      }
    }

    cvsRender (ctx) {
      let img, row;
      let sx, sy, sw, sh, dx, dy;
      let elem, ih, iw
      if (this._image && this._width !== 0 && this._height !== 0) {
        img = this._image;
        ih = img.height
        iw = img.width
        elem = img._element;
        sx = this._frameLeft;
        sy = Math.min(this._frameTop, ih - this.drawSize.h);
        sw = Math.min(iw - sx, this.drawSize.w);
        sh = Math.min(ih - sy, this.drawSize.h);
        dx = (this._width - this.drawSize.w) / 2
        dy = (this._height - this.drawSize.h) / 2
        ctx.drawImage(elem, sx, sy, sw, sh, dx, dy, this.drawSize.w, this.drawSize.h);
      }
    }

    status () {
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
    }

    update (status) {
      for(let i in status) {
        this[i] = status[i]
      }  
    }

    emitChanges () {

      if(this.updateThreshold > 0)
        return

      if(this.shouldUpdate) {
        Connection.update(this.status());
        this.updateThreshold = updateThreshold
      }
      this.shouldUpdate = false
    }

    isInView (other) {
      let a = Math.atan2(other.cy - this.cy, other.cx - this.cx) * to_degrees
      return angleDifference(Math.min(this.rotation, a), Math.max(this.rotation, a)) <= this.light.angle2
    }

    remove () {
      if(this.light) {
        this.light.remove()
        this.light = null
      }
      enchant.Sprite.prototype.remove.call(this)
    }

  }

  class Enemy extends Player {
    
    constructor (color) {
      super(color);
      this.opacity = 0
      this.walkSpeed = walkSpeed
      this.turnSpeed = turnSpeed
      this.x = game.width / 2 + 100
      this.y = game.height / 2
    }

    onEnterFrame () {
      this.updateVisibility()
      this.move()
      this.updateFrameSet()
    }

    move () {
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
    }

    updateVisibility () {
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
    }

    wedgie () {
      Player.prototype.wedgie.call(this)
      Connection.wedgie(this.id)
    }

    banzai () {
      Player.prototype.banzai.call(this)
      Connection.banzai(this.id)
    }

    consumePill (pill) {
      if(!this.pillEffects[pill.type]) {
        this.pillEffects[pill.type] = pill
        pill.applyEffect(this)        
      }
    }

    performBanzaiHit () {
      //nada
    }
  }

  return {
    Enemy: Enemy,
    Player: Player
  }

})