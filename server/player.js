const u = require('./utils'),
      texts = require('./texts'),
      {send, broadcastToOthers} = require('gamestate')
      Timer = u.Timer

const walkSpeed = 6/3,
      banzaiWalkSpeed = 4/3,
      banzaidDuration = 3500,
      wedgiedDuration = 3500

class Player {

  constructor (id, getSpawnPoint) {
    this.clearDeathTimeout = new Timer(() => this.clearDeath(), wedgiedDuration)
    this.getSpawnPoint = getSpawnPoint
    this.id = id
    this.name = ""
    this.color = ""
    this.reset()
  }

  reset () {
    this.clearDeathTimeout.stop()
    this.walkSpeed = walkSpeed
    this.wedgied = this.banzaid = this.banzaiMode = false;
    this.pillEffects = {}
    this.speedMultiplier = 1
    this.v = 
      this.rotV = 
      this.rotation = 
      this.wedgieCount = 
      this.banzaiCount = 
      this.deathCount =
      this.score =
      this.performingWedgie = 
      this.performingBanzai = 0
    const spawnPoint = this.getSpawnPoint()
    this.x = spawnPoint.x
    this.y = spawnPoint.y
  }

  toJson () {
    return {
      id: this.id,
      name: this.name,
      rotation: this.rotation,
      rotV: this.rotV,
      v: this.v,
      x: this.x,
      y: this.y,
      color: this.color,
      wedgied: this.wedgied,
      banzaid: this.banzaid,
      banzaiMode: this.banzaiMode,
      performingBanzai: this.performingBanzai,
      performingWedgie: this.performingWedgie,
      speedMultiplier: this.speedMultiplier
    }
  }

  scores () {
    return {
      wedgieCount: this.wedgieCount,
      banzaiCount: this.banzaiCount,
      deathCount: this.deathCount,
      score: this.score
    }
  }
  
  update (msg) {
    if(this.isDead)
      return;

    let status = msg;
    status.id = this.id
    status.performingBanzai = this.canPerformBanzai() ? status.performingBanzai : false
    status.performingWedgie = this.canPerformWedgie() ? status.performingWedgie : false
    status.v = Math.min(status.v, (status.banzaiMode ? banzaiWalkSpeed : walkSpeed)*this.speedMultiplier)

    for(let i in status) {
      this[i] = status[i]
    }
    
    broadcastToOthers(this.id, 'enemyUpdate', status)
  }

  getAbsCollision (col) {
    col = col || this.collision;
    return {
      x: this.x + col.x,
      y: this.y + col.y,
      w: col.w,
      h: col.h
    };
  }
    
  canPerformWedgie () {
    return !this.banzaiMode && !this.performingWedgie && !this.wedgied && !this.banzaid
  }
  
  canPerformBanzai () {
    return this.banzaiMode && !this.performingBanzai && !this.wedgied && !this.banzaid
  }

  claimWedgie () {
    this.wedgieCount++
    this.score += 5
    send(this.id, 'score', this.scores())
  }

  claimBanzai () {
    this.banzaiCount++
    this.score += 2
    send(this.id, 'score', {
      wedgieCount: this.wedgieCount,
      banzaiCount: this.banzaiCount
    })
  }

  wedgie (enemy) {
    this.wedgied = true
    this.banzaiMode = false
    this.deathCount++
    this.performingBanzai = false
    this.performingWedgie = false
    send(this.id, 'wedgie', enemy.id)
    broadcastToOthers(this.id, 'enemyWedgie', this.id)
    this.clearDeathTimeout.start(wedgiedDuration)
    broadcastToOthers(this.id, 'text', texts.wedgie(this.name, enemy.name))
  }

  banzai (enemy) {
    this.banzaid = true
    if (!this.wedgied) this.deathCount++
    this.banzaiMode = false
    this.performingBanzai = false
    this.performingWedgie = false
    send(this.id, 'banzai', enemy.id)
    broadcastToOthers(this.id, 'enemyBanzai', this.id)
    this.clearDeathTimeout.start(banzaidDuration)
    broadcastToOthers(this.id, 'text', texts.banzai(this.name, enemy.name))
  }

  clearDeath () {
    if(this.banzaid) {
      const spawnPoint = this.getSpawnPoint()
      this.x = spawnPoint.x
      this.y = spawnPoint.y
    }
    this.wedgied = false
    this.banzaid = false
    const msg = { id: this.id, x: this.x, y: this.y }
    send(this.id, 'clearDeath', msg)
    broadcastToOthers(this.id, 'clearDeath', msg)
  }

  consumePill (pill) {
    if (this.pillEffects[pill.type]) {
      clearTimeout(this.pillEffects[pill.type].timeout)
    }
    this.pillEffects[pill.type] = pill
    const msg = { playerId: this.id, pillId: pill.id }
    send(this.id, 'consumePill', msg)
    broadcastToOthers(this.id, 'consumePill', msg)
  }

  clearPill (type) {
    const msg = { playerId: this.id, type }
    send(this.id, 'clearPillEffect', msg)
    broadcastToOthers(this.id, 'clearPillEffect', msg)
  }

  remove () {
    this.clearDeathTimeout.stop()
    for(let type in this.pillEffects) {
      this.pillEffects[type].clearEffect()
    }
  }
  
}

module.exports = Player