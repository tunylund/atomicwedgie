define(['/socket.io/socket.io.js'], function(io) {

  var game

  var Connection = {
    
    init: function() {
      game = enchant.Game.instance
      this.noConnection = true;
      this.waitMsgTimeout = setTimeout(function() {
        this.waitMsg = document.createElement("div")
        this.waitMsg.className = 'msg'
        this.waitMsg.innerHTML = "Wait for it..."
        document.body.insertBefore(document.getElementById("enchant-stage"), this.waitMsg)
      }, 3000);
      
      try {
        this.socket = io.connect();

        this.socket.on('connect', this.onConnect);
        this.socket.on('connect_failed', this.onConnectFailed);
        this.socket.on('join', this.onJoin);
        this.socket.on('message', this.onMessage);
        this.socket.on('disconnect', this.onDisconnect);
        this.socket.on('error', this.onError);
        this.socket.on('spawn', this.onSpawn);
        this.socket.on('wedgie', this.onWedgie);
        this.socket.on('banzai', this.onBanzai);
        this.socket.on('clearDeath', this.onClearDeath);
        this.socket.on('score', this.onScore);
        this.socket.on('text', this.onText);
        this.socket.on('newPill', this.onNewPill)
        this.socket.on('delPill', this.onDelPill)
        this.socket.on('consumePill', this.onConsumePill)
        this.socket.on('clearPillEffect', this.onClearPillEffect)
        this.socket.on('newGame', this.onNewGame);
        this.socket.on('endGame', this.onEndGame);
        this.socket.on('enemyJoin', this.onEnemyJoin);
        this.socket.on('enemyWedgie', this.onEnemyWedgie);
        this.socket.on('enemyBanzai', this.onEnemyBanzai);
        this.socket.on('enemySpawn', this.onEnemySpawn);
        this.socket.on('enemyUpdate', this.onEnemyUpdate);
        this.socket.on('enemyDisconnect', this.onEnemyDisconnect);
        this.socket.on('lagCheck', this.onLagCheck);
      } catch(e) {
        console.error(e);
      }
    },
      
    onConnect: function(response) {
      clearTimeout(Connection.waitMsgTimeout);
      if(this.msg)
        document.body.removeChild(this.msg)
      console.log("connectino established");
      if(Connection.noConnection) {
        Connection.join();
        Connection.noConnection = false;
        Connection.getLag();
      }

    },
    
    onConnectFailed: function(response) {
      console.error("failed to connect", response);
      clearTimeout(this.waitMsgTimeout);
      this.msg.innerHTML = "".concat("<div class='msg'>",
        "Oh that's too bad.. It seems that your browser or ",
        "network does not support web sockets properly. ",
        "Are you using some old evil browser or are ou behind ",
        "an evil evil proxy? </div>");
      
    },

    onJoin: function(response) {
      console.log('join received: ', response);
      //game.addPlayer(response.player);
      game.addEnemies(response.enemies);
    },

    onNewGame: function(response) {
      game.reset()
      game.setMap(response.map);
      game.hud.time.time = response.gameTime / 1000
      game.hud.wedgieScoreLabel.score = 0
      game.hud.banzaiScoreLabel.score = 0
      game.addPlayer(response.player);
      //game.player.update(response.player)
      game.onNewGame();
    },

    onMessage: function(message) {
      console.log('message received: ', message);
    },

    onDisconnect: function() {
      console.log("connection broken");
      window.location = "index.html";
    },
    
    onError: function() {
      console.error(arguments);
      //window.location = "index.html";
    },
    
    onEnemyJoin: function(enemy) {
      game.addEnemy(enemy);
    },
    
    onEnemyUpdate: function(status) {
      game.players[status.id].update(status);
    },
    
    onWedgie: function(enemyId) {
      game.player.wedgie();
      game.insult(enemyId)
    },

    onBanzai: function(enemyId) {
      game.player.banzai();
      if(!game.player.wedgied) {
        game.insult(enemyId)
      }
    },

    onClearDeath: function(response) {
      game.players[response.id].clearDeath(response)
    },

    onEnemyWedgie: function(id) {
      console.log("onEnemyWedgie " + id);
      game.players[id].wedgie();
    },

    onEnemyBanzai: function(id) {
      console.log("onEnemyBanzai " + id);
      game.players[id].banzai();
    },
    
    onEnemyDisconnect: function(id) {
      game.trashPlayer(id);
    },
    
    onLagCheck: function(serverTime) {
      var lag = new Date().getTime() - Connection.lagCheckTime;
      game.hud.lag.innerHTML = lag /* + " updateLag: " + serverTime.updateLag*/
    },

    onScore: function(scores) {
      game.hud.wedgieScoreLabel.score = scores.wedgieCount
      game.hud.banzaiScoreLabel.score = scores.banzaiCount
    },

    onText: function(text) {
      game.hud.texts.add(text)
    },

    onEndGame: function(result) {
      game.endGame(result)
    },

    onNewPill: function(pill) {
      game.newPill(pill)
    },
    onDelPill: function(pillId) {
      game.delPill(pillId)
    },
    onConsumePill: function(result) {
      game.consumePill(result.playerId, result.pillId)
    },
    onClearPillEffect: function(result) {
      var player = game.players[result.playerId]
      if(player)
        player.clearPillEffect(result.type)
    },

    getLag: function() {
      this.lagCheckTime = new Date().getTime();
      this.socket.send("getLag");
      setTimeout(function() {
        Connection.getLag()
      }, 15000);
    },
    
    send: function(message) {
      this.socket.send(message);
    },
    
    wedgie: function(victimId) {
      this.socket.emit("wedgie", victimId);
    },

    banzai: function(victimId) {
      this.socket.emit("banzai", victimId);
    },

    consumePill: function(pill) {
      this.socket.emit("consumePill", pill.id)
    },
    
    update: function(status) {
      this.socket.emit("update", status);
    },
    
    join: function() {
      var character = {};
      try {
        character = JSON.parse(localStorage.getItem("character"));
      } catch(e){
        console.warn("no character selected, using defaults");
      };
      this.socket.emit("joinRequest", character);
    }
    
  };

  /* Log connection*/
  /*
  for(var i in Connection) {
    Connection["_" + i] = Connection[i];
    Connection[i] = new Function(
      "console.log(arguments);" +
      "return Connection['_" + i + "'].apply(Connection, arguments);"
    );
  }
  */

  return Connection
})