const u = require('./utils.js'),
      Player = require('./player.js'),
      maps = require('./maps.js'),
      texts = require('./texts.js'),
      Timer = u.Timer

const players = []
const endGameTimeout = new Timer(endGame, (2 * 60 + 30) * 1000) // 2:30mins
const newGameTimeout = new Timer(initNewGame, 1000)
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
  player.client.json.emit("newGame", {
    gameTime: endGameTimeout.timeLeft,
    map: map.toJson(),
    player: player.toJson(),
    enemies: players
      .filter(p => p.id != player.id)
      .map(p => p.toJson())
  })
  player.client.json.broadcast.emit("enemyUpdate", player.toJson())
}

function emitEndGame(player) {
  const scores = players
    .map(player => ({ [player.id] : player.scores()}))
    .reduce(Object.assign, {})
  player.client.json.emit("endGame", {
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
  
  player.client.json.emit('join', {
    player: player.toJson()
  });
  player.client.broadcast.json.emit("enemyJoin", player.toJson());

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
      player.client.emit("delPill", pillId);
    }
  }
}

function lagCheck(player) {
  const now = new Date()
  player.client.json.emit("lagCheck", {
    lag: now.getTime() + now.getTimezoneOffset()*60000
  });
}

function disconnect(player) {
  console.log("disconnect from " + player.name);
  player.client.broadcast.emit("enemyDisconnect", player.id);
  
  player.remove()
  players.splice(players.findIndex(p => p.id === player.id), 1)
  
  if(players.length == 0) {
    map.remove()
    map = null
    endGameTimeout.stop()
    newGameTimeout.stop()
  }
}

exports.game = {

  status: function() {
    return {
      players: players.map(p => p.toJson()),
      startTime: endGameTimeout.startTime
    }
  },
  
  connect: function(client) {
  
    if(players.length == 0) {
      initNewGame();
    }

    const on = (ev, fn) => {
      client.on(ev, (...args) => {
        console.log(`${ev} received`, ...args)
        fn(...args)
      })
    }
  
    let player = new Player(client, () => map.getSpawnPoint())
    players.push(player);
    on('joinRequest', (...args) => handleJoinRequest(...args, player))
    client.on('update', (...args) => player.update(...args));
    on('wedgie', (...args) => wedgie(...args, player));
    on('banzai', (...args) => banzai(...args, player));
    on('consumePill', (...args) => consumePill(...args, player))
    client.on('lagCheck', (...args) => lagCheck(...args, player))
    on('disconnect', () => disconnect(player))
  }

};
