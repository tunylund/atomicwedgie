var u = require('./utils.js')

var turnSpeed = 10,
    walkSpeed = 5,
    banzaiWalkSpeed = 3,
    wedgieDistance = 32,
    banzaiDistance = 48,
    banzaidDuration = 3500,
    wedgiedDuration = 3500,
    wedgieDirectionThreshold = 75 //255 max

exports.Player = function (client) {

  this.id = "player_" + u.id();
  this.name = "";
  /*
  this.w = this.characterType.tileset.tilew;
  this.hw = this.w/2;
  this.h = this.characterType.tileset.tileh;
  this.hh = this.h/2;
  */
  this.client = client || {on: u.voidfn, emit: u.voidfn, send: u.voidfn};
  this.color = "green"
  this.reset()
  this.lagChecks = [];
};

exports.Player.prototype = {

  reset: function() {
    clearTimeout(this.clearDeathTimeout)
    for(var type in this.pillEffects) {
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
  },

  toJson: function() {
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
  },

  scores: function() {
    return {
      wedgieCount: this.wedgieCount,
      banzaiCount: this.banzaiCount,
      deathCount: this.deathCount,
      score: this.score
    }
  },
  
  update: function(msg) {
    if(this.isDead)
      return;

    var status = msg;
    
    if(status.time) {
      var now = new Date();
      var utcTime = now.getTime() + now.getTimezoneOffset()*60000;
      this.lagChecks.push(utcTime - status.time);
    }
    
    status.id = this.id;
    status.performingBanzai = this.canPerformingBanzai() ? status.performingBanzai : false;
    status.performingWedgie = this.canPerformingWedgie() ? status.performingWedgie : false;
    status.v = u.limit(status.v, (status.banzaiMode ? banzaiWalkSpeed : walkSpeed)*this.speedMultiplier);

    for(var i in status) {
      this[i] = status[i]
    }
    
    this.client.broadcast.emit("enemyUpdate", status);
  },

  getAbsCollision: function(col) {
    col = col || this.collision;
    return {
      x: this.x + col.x,
      y: this.y + col.y,
      w: col.w,
      h: col.h
    };
  },
    
  canPerformingWedgie: function() {
    return !this.banzaiMode && !this.performingWedgie && !this.wedgied && !this.banzaid;
  },
  
  canPerformingBanzai: function() {
    return this.banzaiMode && !this.performingBanzai && !this.wedgied && !this.banzaid;
  },

  clearDeath: function() {
    this.wedgied = false
    this.banzaid = false
  },
  
  wedgie: function(enemy) {
    this.wedgied = true
    this.banzaiMode = false
    this.performingBanzai = false
    this.performingWedgie = false
    this.client.emit("wedgie", enemy.id);
    this.client.broadcast.emit("enemyWedgie", this.id);
    clearTimeout(this.clearDeathTimeout)
    this.clearDeathTimeout = setTimeout(u.proxy(this.clearDeath, this), wedgiedDuration)
  },

  banzai: function(enemy) {
    this.banzaid = true
    this.banzaiMode = false
    this.performingBanzai = false
    this.performingWedgie = false
    this.client.emit("banzai", enemy.id);
    this.client.broadcast.emit("enemyBanzai", this.id);
    clearTimeout(this.clearDeathTimeout)
    this.clearDeathTimeout = setTimeout(u.proxy(this.clearDeath, this), banzaidDuration)
  },

  clearDeath: function() {
    if(this.banzaid) {
      var spawnPoint = this.game.map.getSpawnPoint()
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
  },

  consumePill: function(pill) {
    pill.applyEffect(this)
    if(!this.pillEffects[pill.type])
      this.pillEffects[pill.type] = pill
    clearTimeout(this.pillEffects[pill.type].timeout)
    this.pillEffects[pill.type].timeout = setTimeout(u.proxy(this.clearPillEffect, this, pill.type), pill.duration)
    this.client.emit("consumePill", {
      playerId: this.id,
      pillId: pill.id
    })
    this.client.broadcast.json.emit("consumePill", {
      playerId: this.id,
      pillId: pill.id
    })
  },

  clearPillEffect: function(type) {
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
  },

  remove: function() {
    clearTimeout(this.clearDeathTimeout)
    for(var type in this.pillEffects) {
      clearTimeout(this.pillEffects[type].timeout)
    }
  }
  
};
