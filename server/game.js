const u = require('./utils.js'),
      Player = require('./player.js'),
      maps = require('./maps.js'),
      {send, broadcastToOthers, on} = require('gamestate'),
      Timer = u.Timer

const players = []
const endGameTimeout = new Timer(endGame, (2 * 60 + 30) * 1000) // 2:30mins
const newGameTimeout = new Timer(initNewGame, 10000)
let map = null

function initNewGame() {
  map = maps.random(players)
  endGameTimeout.start()
  players.map(emitNewGame)
}

function endGame() {
  newGameTimeout.start()
  players.map(emitEndGame)
  map.remove()
}

function emitNewGame(player) {
  player.reset()
  send(player.channel, 'newGame', {
    gameTime: endGameTimeout.timeLeft,
    map: map.toJson(),
    player: player.toJson(),
    enemies: players
      .filter(p => p.id != player.id)
      .map(p => p.toJson())
  })
  broadcastToOthers(player.channel, "enemyUpdate", player.toJson())
}

function emitEndGame(player) {
  const scores = players
    .map(player => ({ [player.id] : player.scores()}))
    .reduce(Object.assign, {})
  send(player.channel, 'endGame', {
    scores,
    nextGameIn: newGameTimeout.timeLeft
  })
}

function handleJoinRequest(request, player) {
  player = player || request;
  request = request || {color: "green", name: "Anonyymy lyyli"};
  player.name = request.name
  player.color = request.color
  console.log("joinrequest from " + player.name);



  send(player.channel, 'join', {
    player: player.toJson()
  })
  broadcastToOthers(player.channel, 'enemyJoin', player.toJson())

  emitNewGame(player)
  if(newGameTimeout.isTicking) {
    emitEndGame(player)
  }
}

function wedgie(victimId, player) {
  if(newGameTimeout.isTicking) return;
  const victim = players.find(p => p.id === victimId);
  const isWedgieable = !victim.wedgied && !victim.banzaid && victim.id != player.id
  if(isWedgieable) {
    victim.wedgie(player);
    player.claimWedgie()
  }
}

function banzai(victimId, player) {
  if(newGameTimeout.isTicking) return;
  const victim = players.find(p => p.id === victimId);
  const isBanzaiable = !victim.banzaid && !victim.invincibleAgainstBanzai && victim.id != player.id
  if(isBanzaiable) {
    victim.banzai(player);
    if(!victim.wedgied) {
      player.claimBanzai()
    }
  }
}

function consumePill(pillId, player) {
  if(newGameTimeout.isTicking) return;
  const pill = map.popPill(pillId)
  if (pill) {
    pill.applyEffect(player)
    for(let player of players) {
      send(player.channel, 'delPill', pillId)
    }
  }
}

function lagCheck(player) {
  const now = new Date()
  send(player.channel, 'lagCheck', {
    lag: now.getTime() + now.getTimezoneOffset()*60000
  })
}

function disconnect(player) {
  console.log("disconnect from " + player.name);
  broadcastToOthers(player.channel, 'enemyDisconnect', player.id)
  
  player.remove()
  players.splice(players.findIndex(p => p.id === player.id), 1)
  
  if(players.length == 0) {
    map.remove()
    map = null
    endGameTimeout.stop()
    newGameTimeout.stop()
  }
}

exports.connectToGame = function(id) {
  if(players.length == 0) {
    initNewGame();
  }

  const _on = (ev, fn) => {
    on(id, ev, (...args) => {
      console.log(`${ev} received`, ...args)
      fn(...args)
    })
  }

  const player = new Player(id, () => map.getSpawnPoint())
  players.push(player);
  _on('joinRequest', (...args) => handleJoinRequest(...args, player))
  on(id, 'update', (...args) => player.update(...args));
  _on('wedgie', (...args) => wedgie(...args, player));
  _on('banzai', (...args) => banzai(...args, player));
  _on('consumePill', (...args) => consumePill(...args, player))
  on(id, 'lagCheck', (...args) => lagCheck(...args, player))
  _on('close', () => disconnect(player))
}

exports.status = function() {
  return {
    players: players.map(p => p.toJson()),
    startTime: endGameTimeout.startTime
  }
}
