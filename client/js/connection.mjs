import { connect, on, send } from './transport.mjs'

let game
let msg
let waitMsgTimeout
let lagCheckTime
let noConnection

function onConnect() {
  clearTimeout(waitMsgTimeout);
  if(msg) document.body.removeChild(msg)
  if(noConnection) {
    Connection.join()
    noConnection = false
    Connection.getLag()
  }
}

function onConnectFailed() {
  clearTimeout(waitMsgTimeout);
  if (!msg) showWaitMsg()
  msg.innerHTML = "".concat("<div class='msg'>",
  "Oh that's too bad.. It seems that your browser or ",
  "network does not support web sockets properly. ",
  "Are you using some old evil browser or are ou behind ",
  "an evil evil proxy? </div>")
}

function showWaitMsg() {
  msg = document.createElement("div")
  msg.className = 'msg'
  msg.innerHTML = "Wait for it..."
  document.body.prepend(msg)
}

const Connection = {
  
  init: function() {
    game = enchant.Game.instance
    noConnection = true;
    waitMsgTimeout = setTimeout(showWaitMsg, 3000);
    
    try {
      connect()
      
      on('open', onConnect)
      on('socket-error', onConnectFailed)
      on('join', () => {})
      on('message', () => {})
      on('close', () => window.location = "index.html")
      on('socket-error', err => console.error(err))

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
      on('enemyUpdate', status => game.players[status.id].update(status))
      on('enemyDisconnect', id => game.trashPlayer(id))
      on('lagCheck', serverTime => {
        game.hud.lag.innerHTML = new Date().getTime() - lagCheckTime;
      })
    } catch(e) {
      console.error(e);
    }
  },

  getLag: function() {
    lagCheckTime = new Date().getTime();
    send("lagCheck");
    setTimeout(function() {
      Connection.getLag()
    }, 15000);
  },
  
  send: message => send.send(message),
  wedgie: victimId => send("wedgie", victimId),
  banzai: victimId => send("banzai", victimId),
  consumePill: pill => send("consumePill", pill.id),
  update: status => send("update", status),
  join: () => {
    let character = {}
    try {
      character = JSON.parse(localStorage.getItem("character"));
    } catch(e){
      console.warn("no character selected, using defaults");
    };
    send("joinRequest", character);
  }
}

export default Connection
