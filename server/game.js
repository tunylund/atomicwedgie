var u = require('./utils.js'),
    Player = require('./player.js').Player,
    maps = require('./maps.js'),
    texts = require('./texts.js')

exports.game = {

  players: new u.HashList(),
  startTime: null,
  map: null,
  gameTime: (2*60 + 30)*1000, // 3min
  nextGameIn: 15000,
  nextGameAt: new Date().getTime(),
  
  initNewGame: function() {
    this.gameEnded = false
    //this.map = new maps.Map(maps.maps[5], this);
    this.map = new maps.Map(u.randomFrom(maps.maps), this);
    this.startTime = new Date().getTime()
    this.endGameTimeout = setTimeout(u.proxy(this.endGame, this), this.gameTime)
    for(var i in this.players.hash) {
      this.emitNewGame(this.players.hash[i])
    }
  },

  endGame: function() {
    this.gameEnded = true
    this.scores = {}
    for(var i in this.players.hash) {
      var player = this.players.hash[i]
      this.scores[player.id] = player.scores()
    }
    this.nextGameAt = new Date().getTime() + this.nextGameIn
    for(var i in this.players.hash) {
      this.emitEndGame(this.players.hash[i])
    }
    this.map.remove()
    this.newGameTimeout = setTimeout(u.proxy(this.initNewGame, this), this.nextGameIn)
  },

  emitNewGame: function(player) {
    var gameTime = this.startTime + this.gameTime - 2000 - new Date().getTime(),
        spawnPoint = this.map.getSpawnPoint()
    player.reset()
    player.x = spawnPoint.x
    player.y = spawnPoint.y
    player.client.json.emit("newGame", {
      gameTime: gameTime < 0 ? 0 : gameTime,
      map: this.map.toJson(),
      player: player.toJson()
    })
    player.client.json.broadcast.emit("enemyUpdate", player.toJson())
  },

  emitEndGame: function(player) {
    var t = this.nextGameAt - new Date().getTime() - 2000
    player.client.json.emit("endGame", {
      scores: this.scores,
      nextGameIn: t < 0 ? 0 : t
    })
  },
  
  status: function() {
    var players = []
    for(var i=0; i<this.players.length; i++) {
      players.push(this.players.arr[i].toJson())
    }
    return {
      players: players,
      startTime: this.startTime
    }
  },
  
  connect: function(client) {
  
    if(this.players.length == 0) {
      this.initNewGame();
    }
  
    var player = new Player(client)
    player.game = this
    this.players.push(player);
    client.on('joinRequest', u.proxy(this.onJoinRequest, this, player));
    client.on('update', u.proxy(player.update, player));
    client.on('wedgie', u.proxy(this.onWedgie, this, player));
    client.on('banzai', u.proxy(this.onBanzai, this, player));
    client.on('consumePill', u.proxy(this.onConsumePill, this, player))
    client.on('message', u.proxy(this.onMessage, this, player));
    client.on('disconnect', u.proxy(this.onDisconnect, this, player));
  },

  text: function(text, player) {
    player.client.broadcast.emit("text", text);
    player.client.emit("text", text);
  },

  onJoinRequest: function(request, player) {
    player = player || request;
    request = request || {color: "green", name: "Anonyymy lyyli"};
    player.name = request.name
    player.color = request.color
    console.log("joinrequest from " + player.name);
    
    player.client.json.emit('join', {
      player: player.toJson(),
      enemies: this.players.allbut({
        id: player.id
      }).toJson()
    });
    player.client.broadcast.json.emit("enemyJoin", player.toJson());

    this.emitNewGame(player)
    if(this.gameEnded) {
      this.emitEndGame(player)
    }

  },
  
  onMessage: function(message, player) {
    switch(message) {
      case "getLag":
        var now = new Date(),
            lag = now.getTime() + now.getTimezoneOffset()*60000,
            updateLag = 0;
        player.client.json.emit("lagCheck", {
          lag: lag
        });
        break;
    }
  },
  
  onWedgie: function(victimId, player) {
    if(this.gameEnded) return;
    var victim = this.players.hash[victimId];
    if(this.isWedgieable(victim, player)) {
      victim.wedgie(player);
      victim.deathCount++
      player.wedgieCount++
      player.score += 5
      player.client.json.emit("score", player.scores());
      victim.client.broadcast.emit("text", texts.wedgie(victim, player));
    }
  },

  onBanzai: function(victimId, player) {
    if(this.gameEnded) return;
    var victim = this.players.hash[victimId];
    if(this.isBanzaiable(victim, player)) {
      victim.banzai(player);
      if(!victim.wedgied) {
        victim.deathCount++
        player.banzaiCount++
        player.score += 2
        player.client.json.emit("score", {
          wedgieCount: player.wedgieCount,
          banzaiCount: player.banzaiCount
        });
      }
      victim.client.broadcast.emit("text", texts.banzai(victim, player));
    }
  },

  onConsumePill: function(pillId, player) {
    if(this.gameEnded) return;
    this.map.consumePill(pillId, player)
  },
  
  onDisconnect: function(something, player) {
    console.log("disconnect from " + player.name);
    player.client.broadcast.emit("enemyDisconnect", player.id);
    
    player.remove()
    this.players.remove(player);
    
    if(this.players.length == 0) {
      this.map.remove()
      delete this.map
      this.map = null
      clearTimeout(this.endGameTimeout)
      clearTimeout(this.newGameTimeout)
    }
  },
  
  isWedgieable: function(victim, player) {
    if(!victim.wedgied && !victim.banzaid && victim.id != player.id) {
      return true;
    /* collision check always lags behind the game
      var col = player.getAbsCollision(player.strikeCollision);
      var vcol = victim.getAbsCollision();
      return (u.collides(col, vcol));
      */
    }
    return false;
  },

  isBanzaiable: function(victim, player) {
    if(!victim.banzaid 
        && !victim.pillEffects["red"]
        && victim.id != player.id) {
      return true
    }
  }

};
