const u = require('./utils'),
      texts = require('./texts'),
      Timer = u.Timer

const turnSpeed = 10,
      walkSpeed = 5,
      banzaiWalkSpeed = 3,
      wedgieDistance = 32,
      banzaiDistance = 48,
      banzaidDuration = 3500,
      wedgiedDuration = 3500,
      wedgieDirectionThreshold = 75 //255 max

class Player {

  constructor (client, getSpawnPoint) {
    this.clearDeathTimeout = new Timer(() => this.clearDeath(), wedgiedDuration)
    this.getSpawnPoint = getSpawnPoint
    this.client = client
    this.id = "player-" + u.id()
    this.name = ""
    this.color = ""
    this.reset()
    this.lagChecks = []
  }

  reset () {
    this.clearDeathTimeout.stop()
    this.walkSpeed = walkSpeed
    this.turnSpeed = turnSpeed
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
    
    if(status.time) {
      const now = new Date();
      const utcTime = now.getTime() + now.getTimezoneOffset()*60000;
      this.lagChecks.push(utcTime - status.time);
    }
    
    status.id = this.id
    status.performingBanzai = this.canPerformingBanzai() ? status.performingBanzai : false
    status.performingWedgie = this.canPerformingWedgie() ? status.performingWedgie : false
    status.v = Math.min(status.v, (status.banzaiMode ? banzaiWalkSpeed : walkSpeed)*this.speedMultiplier)

    for(let i in status) {
      this[i] = status[i]
    }
    
    this.client.broadcast.emit("enemyUpdate", status);
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
    
  canPerformingWedgie () {
    return !this.banzaiMode && !this.performingWedgie && !this.wedgied && !this.banzaid
  }
  
  canPerformingBanzai () {
    return this.banzaiMode && !this.performingBanzai && !this.wedgied && !this.banzaid
  }

  claimWedgie () {
    this.wedgieCount++
    this.score += 5
    this.client.json.emit("score", this.scores())
  }

  claimBanzai () {
    this.banzaiCount++
    this.score += 2
    this.client.json.emit("score", {
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
    this.client.emit("wedgie", enemy.id);
    this.client.broadcast.emit("enemyWedgie", this.id);
    this.clearDeathTimeout.start(wedgiedDuration)
    this.client.broadcast.emit("text", texts.wedgie(this, enemy));
  }

  banzai (enemy) {
    this.banzaid = true
    if (!this.wedgied) this.deathCount++
    this.banzaiMode = false
    this.performingBanzai = false
    this.performingWedgie = false
    this.client.emit("banzai", enemy.id);
    this.client.broadcast.emit("enemyBanzai", this.id);
    this.clearDeathTimeout.start(banzaidDuration)
    this.client.broadcast.emit("text", texts.banzai(this, enemy));
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
    this.client.json.emit("clearDeath", msg);
    this.client.broadcast.emit("clearDeath", msg);
  }

  consumePill (pill) {
    if (this.pillEffects[pill.type]) {
      clearTimeout(this.pillEffects[pill.type].timeout)
    }
    this.pillEffects[pill.type] = pill
    const msg = { playerId: this.id, pillId: pill.id }
    this.client.emit("consumePill", msg)
    this.client.broadcast.json.emit("consumePill", msg)
  }

  clearPill (type) {
    const msg = { playerId: this.id, type }
    this.client.emit("clearPillEffect", msg)
    this.client.broadcast.json.emit("clearPillEffect", msg)
  }

  remove () {
    this.clearDeathTimeout.stop()
    for(let type in this.pillEffects) {
      this.pillEffects[type].clearEffect()
    }
  }
  
}

module.exports = Player