const u = require('./utils.js'),
      Player = require('./player.js').Player,
      maps = require('./maps.js'),
      texts = require('./texts.js')

const players = new u.HashList()
let startTime = null
let map = null
const gameTime = (2*60 + 30)*1000 // 3min
const nextGameIn = 15000
let nextGameAt = new Date().getTime()
let gameEnded = false
let endGameTimeout = null
let newGameTimeout = null
let scores = {}

function initNewGame() {
  //map = new maps.Map(maps.maps[5], this);
  map = new maps.Map(u.randomFrom(maps.maps), exports.game);
  startTime = new Date().getTime()
  endGameTimeout = setTimeout(endGame, gameTime)
  for(let i in players.hash) {
    emitNewGame(players.hash[i])
  }
}

function endGame() {
  gameEnded = true
  scores = {}
  for(let i in players.hash) {
    var player = players.hash[i]
    scores[player.id] = player.scores()
  }
  nextGameAt = new Date().getTime() + nextGameIn
  for(let i in players.hash) {
    emitEndGame(players.hash[i])
  }
  map.remove()
  newGameTimeout = setTimeout(initNewGame, nextGameIn)
}

function emitNewGame(player) {
  var _gameTime = startTime + gameTime - 2000 - new Date().getTime(),
      spawnPoint = map.getSpawnPoint()
  player.reset()
  player.x = spawnPoint.x
  player.y = spawnPoint.y
  player.client.json.emit("newGame", {
    gameTime: _gameTime < 0 ? 0 : _gameTime,
    map: map.toJson(),
    player: player.toJson()
  })
  player.client.json.broadcast.emit("enemyUpdate", player.toJson())
}

function emitEndGame(player) {
  var t = nextGameAt - new Date().getTime() - 2000
  player.client.json.emit("endGame", {
    scores: scores,
    nextGameIn: t < 0 ? 0 : t
  })
}

exports.game = {

  get players () {
    return players
  },

  get map () {
    return map
  },

  status: function() {
    let _players = []
    for(let i=0; i<players.length; i++) {
      _players.push(players.arr[i].toJson())
    }
    return {
      players: _players,
      startTime: startTime
    }
  },
  
  connect: function(client) {
  
    if(players.length == 0) {
      initNewGame();
    }
  
    let player = new Player(client)
    player.game = this
    players.push(player);
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
      enemies: players.allbut({
        id: player.id
      }).toJson()
    });
    player.client.broadcast.json.emit("enemyJoin", player.toJson());

    emitNewGame(player)
    if(gameEnded) {
      emitEndGame(player)
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
    if(gameEnded) return;
    var victim = players.hash[victimId];
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
    if(gameEnded) return;
    var victim = players.hash[victimId];
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
    if(gameEnded) return;
    map.consumePill(pillId, player)
  },
  
  onDisconnect: function(something, player) {
    console.log("disconnect from " + player.name);
    player.client.broadcast.emit("enemyDisconnect", player.id);
    
    player.remove()
    players.remove(player);
    
    if(players.length == 0) {
      map.remove()
      map = null
      clearTimeout(endGameTimeout)
      clearTimeout(newGameTimeout)
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
