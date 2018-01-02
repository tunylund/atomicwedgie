const u = require('./utils.js')

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
    this.getSpawnPoint = getSpawnPoint
    this.client = client
    this.id = "player_" + u.id()
    this.name = ""
    this.color = ""
    this.reset()
    this.lagChecks = []
  }

  reset () {
    clearTimeout(this.clearDeathTimeout)
    for(let type in this.pillEffects) {
      clearTimeout(this.pillEffects[type].timeout)
    }
    this.walkSpeed = walkSpeed
    this.turnSpeed = turnSpeed
    this.wedgied = this.banzaid = this.banzaiMode = false;
    this.pillEffects = {}
    this.speedMultiplier = 1
    this.x = 
      this.y = 
      this.v = 
      this.rotV = 
      this.rotation = 
      this.wedgieCount = 
      this.banzaiCount = 
      this.deathCount =
      this.score =
      this.performingWedgie = 
      this.performingBanzai = 0
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
    
    status.id = this.id;
    status.performingBanzai = this.canPerformingBanzai() ? status.performingBanzai : false;
    status.performingWedgie = this.canPerformingWedgie() ? status.performingWedgie : false;
    status.v = u.limit(status.v, (status.banzaiMode ? banzaiWalkSpeed : walkSpeed)*this.speedMultiplier);

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
    return !this.banzaiMode && !this.performingWedgie && !this.wedgied && !this.banzaid;
  }
  
  canPerformingBanzai () {
    return this.banzaiMode && !this.performingBanzai && !this.wedgied && !this.banzaid;
  }

  wedgie (enemy) {
    this.wedgied = true
    this.banzaiMode = false
    this.performingBanzai = false
    this.performingWedgie = false
    this.client.emit("wedgie", enemy.id);
    this.client.broadcast.emit("enemyWedgie", this.id);
    clearTimeout(this.clearDeathTimeout)
    this.clearDeathTimeout = setTimeout(() => this.clearDeath(), wedgiedDuration)
  }

  banzai (enemy) {
    this.banzaid = true
    this.banzaiMode = false
    this.performingBanzai = false
    this.performingWedgie = false
    this.client.emit("banzai", enemy.id);
    this.client.broadcast.emit("enemyBanzai", this.id);
    clearTimeout(this.clearDeathTimeout)
    this.clearDeathTimeout = setTimeout(() => this.clearDeath(), banzaidDuration)
  }

  clearDeath () {
    if(this.banzaid) {
      const spawnPoint = this.getSpawnPoint()
      this.x = spawnPoint.x
      this.y = spawnPoint.y
    }
    this.wedgied = false
    this.banzaid = false
    this.client.json.emit("clearDeath", {
      id: this.id,
      x: this.x,
      y: this.y
    });
    this.client.broadcast.emit("clearDeath", {
      id: this.id,
      x: this.x,
      y: this.y
    });
  }

  consumePill (pill) {
    pill.applyEffect(this)
    if(!this.pillEffects[pill.type])
      this.pillEffects[pill.type] = pill
    clearTimeout(this.pillEffects[pill.type].timeout)
    this.pillEffects[pill.type].timeout = setTimeout(() => this.clearPillEffect(pill.type), pill.duration)
    this.client.emit("consumePill", {
      playerId: this.id,
      pillId: pill.id
    })
    this.client.broadcast.json.emit("consumePill", {
      playerId: this.id,
      pillId: pill.id
    })
  }

  clearPillEffect (type) {
    this.pillEffects[type].clearEffect(this)
    this.client.emit("clearPillEffect", {
      playerId: this.id,
      type: type
    })
    this.client.broadcast.json.emit("clearPillEffect", {
      playerId: this.id,
      type: type
    })
    delete this.pillEffects[type]
  }

  remove () {
    clearTimeout(this.clearDeathTimeout)
    for(let type in this.pillEffects) {
      clearTimeout(this.pillEffects[type].timeout)
    }
  }
  
}

module.exports = Player