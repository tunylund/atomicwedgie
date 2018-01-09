let game
let msg
let waitMsgTimeout
let lagCheckTime
let noConnection
let socket

function onConnect(response) {
  clearTimeout(waitMsgTimeout);
  if(msg) document.body.removeChild(msg)
  if(noConnection) {
    Connection.join();
    noConnection = false;
    Connection.getLag();
  }
}

function onConnectFailed(response) {
  clearTimeout(waitMsgTimeout);
  msg.innerHTML = "".concat("<div class='msg'>",
    "Oh that's too bad.. It seems that your browser or ",
    "network does not support web sockets properly. ",
    "Are you using some old evil browser or are ou behind ",
    "an evil evil proxy? </div>"); 
}

function showWaitMsg() {
  msg = document.createElement("div")
  msg.className = 'msg'
  msg.innerHTML = "Wait for it..."
  document.body.prepend(msg)
}

function on (ev, fn) {
  socket.on(ev, response => {
    console.log(`${ev} received`, response)
    fn(response)
  })
}

const Connection = {
  
  init: function() {
    game = enchant.Game.instance
    noConnection = true;
    waitMsgTimeout = setTimeout(showWaitMsg, 3000);
    
    try {
      socket = io.connect({
        transports: ['websocket']
      });

      on('connect', onConnect)
      on('connect_failed', onConnectFailed)
      on('join', () => {})
      on('message', () => {})
      on('disconnect', () => window.location = "index.html")
      on('error', err => console.error(err))

      on('wedgie', enemyId => {
        game.player.wedgie()
        game.insult(enemyId)
      })

      on('banzai', (enemyId) => {
        game.player.banzai()
        if(!game.player.wedgied) {
          game.insult(enemyId)
        }
      })

      on('clearDeath', response => game.players[response.id].clearDeath(response))
      on('score', scores => {
        game.hud.wedgieScoreLabel.score = scores.wedgieCount
        game.hud.banzaiScoreLabel.score = scores.banzaiCount
      })
      on('text', text => game.hud.texts.add(text))
      on('newPill', pill => game.newPill(pill))
      on('delPill', pill => game.delPill(pill))
      on('consumePill', result => game.consumePill(result.playerId, result.pillId))
      on('clearPillEffect', result => {
        const player = game.players[result.playerId]
        if(player) player.clearPillEffect(result.type)
      })
      on('newGame', response => game.newGame(response.map, response.gameTime, response.player, response.enemies))
      on('endGame', result => game.endGame(result))
      on('enemyJoin', enemy => game.addEnemy(enemy))
      on('enemyWedgie', id => game.players[id].wedgie())
      on('enemyBanzai', id => game.players[id].banzai())
      socket.on('enemyUpdate', status => game.players[status.id].update(status))
      on('enemyDisconnect', id => game.trashPlayer(id))
      socket.on('lagCheck', serverTime => {
        game.hud.lag.innerHTML = new Date().getTime() - lagCheckTime;
      })
    } catch(e) {
      console.error(e);
    }
  },

  getLag: function() {
    lagCheckTime = new Date().getTime();
    socket.emit("lagCheck");
    setTimeout(function() {
      Connection.getLag()
    }, 15000);
  },
  
  send: message => socket.send(message),
  wedgie: victimId => socket.emit("wedgie", victimId),
  banzai: victimId => socket.emit("banzai", victimId),
  consumePill: pill => socket.emit("consumePill", pill.id),
  update: status => socket.emit("update", status),
  join: () => {
    let character = {}
    try {
      character = JSON.parse(localStorage.getItem("character"));
    } catch(e){
      console.warn("no character selected, using defaults");
    };
    socket.emit("joinRequest", character);
  }
}

export default Connection
