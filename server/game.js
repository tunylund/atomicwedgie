const u = require('./utils.js'),
      Player = require('./player.js'),
      maps = require('./maps.js'),
      texts = require('./texts.js')

const players = []
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
  players.map(emitNewGame)
}

function endGame() {
  gameEnded = true
  scores = {}
  for(let player of players) {
    scores[player.id] = player.scores()
  }
  nextGameAt = new Date().getTime() + nextGameIn
  players.map(emitEndGame)
  map.remove()
  newGameTimeout = setTimeout(initNewGame, nextGameIn)
}

function emitNewGame(player) {
  const _gameTime = startTime + gameTime - 2000 - new Date().getTime(),
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
  const t = nextGameAt - new Date().getTime() - 2000
  player.client.json.emit("endGame", {
    scores: scores,
    nextGameIn: t < 0 ? 0 : t
  })
}

function handleJoinRequest(request, player) {
  player = player || request;
  request = request || {color: "green", name: "Anonyymy lyyli"};
  player.name = request.name
  player.color = request.color
  console.log("joinrequest from " + player.name);
  
  player.client.json.emit('join', {
    player: player.toJson(),
    enemies: players
      .filter(p => p.id != player.id)
      .map(p => p.toJson())
  });
  player.client.broadcast.json.emit("enemyJoin", player.toJson());

  emitNewGame(player)
  if(gameEnded) {
    emitEndGame(player)
  }

}

function wedgie(victimId, player) {
  if(gameEnded) return;
  const victim = players.find(p => p.id === victimId);
  if(isWedgieable(victim, player)) {
    victim.wedgie(player);
    victim.deathCount++
    player.wedgieCount++
    player.score += 5
    player.client.json.emit("score", player.scores());
    victim.client.broadcast.emit("text", texts.wedgie(victim, player));
  }
}

function banzai(victimId, player) {
  if(gameEnded) return;
  const victim = players.find(p => p.id === victimId);
  if(isBanzaiable(victim, player)) {
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
}

function consumePill(pillId, player) {
  if(gameEnded) return;
  map.consumePill(pillId, player)
}

function handleMessage(message, player) {
  switch(message) {
    case "getLag":
      let now = new Date(),
          lag = now.getTime() + now.getTimezoneOffset()*60000,
          updateLag = 0;
      player.client.json.emit("lagCheck", {
        lag: lag
      });
      break;
  }
}

function disconnect(player) {
  console.log("disconnect from " + player.name);
  player.client.broadcast.emit("enemyDisconnect", player.id);
  
  player.remove()
  players.splice(players.findIndex(p => p.id === player.id), 1)
  
  if(players.length == 0) {
    map.remove()
    map = null
    clearTimeout(endGameTimeout)
    clearTimeout(newGameTimeout)
  }
}

function isWedgieable(victim, player) {
  return !victim.wedgied && !victim.banzaid && victim.id != player.id
}

function isBanzaiable(victim, player) {
  return !victim.banzaid 
      && !victim.pillEffects["red"]
      && victim.id != player.id
}

exports.game = {

  get players () {
    return players
  },

  get map () {
    return map
  },

  status: function() {
    return {
      players: players.map(p => p.toJson()),
      startTime: startTime
    }
  },
  
  connect: function(client) {
  
    if(players.length == 0) {
      initNewGame();
    }
  
    let player = new Player(client, () => map.getSpawnPoint())
    players.push(player);
    client.on('joinRequest', (...args) => handleJoinRequest(...args, player));
    client.on('update', (...args) => player.update(...args));
    client.on('wedgie', (...args) => wedgie(...args, player));
    client.on('banzai', (...args) => banzai(...args, player));
    client.on('consumePill', (...args) => consumePill(...args, player))
    client.on('message', (...args) => handleMessage(...args, player))
    client.on('disconnect', () => disconnect(player))
  }

};
