define(["resources", 
        "maps", 
        'pills',
        "players",
        "shadows",
        "ui",
        "connection"], function(res, maps, pills, players, Shadows, ui, Connection) {

  var game,
      floor,
      walls,
      decorations,
      mapStage,
      playerStage,
      shadows,
      scoreTable

  function enableShadows() {
    if(!game.shadows) {
      game.shadows = shadows      
    }
  }

  function onLoad() {

    game.assets['pad.png'] = game.assets[res.pad]

    mapStage = new Group();
    game.rootScene.addChild(mapStage);

    playerStage = new Group()
    game.rootScene.addChild(playerStage)
    game.playerStage = playerStage
    game.player = null

    shadows = new Shadows(game.width, game.height)
    game.shadows = shadows
    //game.rootScene.addChild(shadows)

    var time = new ui.TimeLabel(0),
        texts = new ui.ActiveTextList(),
        wedgieScoreLabel = new ui.ScoreLabel("", game.width - 105, 15, 0, "wedgie"),
        banzaiScoreLabel = new ui.ScoreLabel("", game.width - 65, 15, 0, "banzai")
    game.hud = {
      lag: document.getElementById('lagValue'),
      texts: texts,
      wedgieScoreLabel: wedgieScoreLabel,
      banzaiScoreLabel: banzaiScoreLabel,
      time: time
    }

    if(enchant.ENV.TOUCH_ENABLED) {
      var pad = new ui.TouchArrows(),
          wButton = new ui.TouchButton("A", "a"),
          bButton = new ui.TouchButton("B", "b")
      game.touch = {
        pad: pad,
        a: wButton,
        b: bButton
      }      
    }

    game.keybind(65, 'a')
    game.keybind(83, 'b')
    enchant.Core.instance.addEventListener("abuttonup", function(e) {
      enchant.Game.instance.input.aUp = true
    })
    enchant.Core.instance.addEventListener("bbuttonup", function(e) {
      enchant.Game.instance.input.bUp = true
    })
    enchant.Core.instance.addEventListener("leftbuttonup", function(e) {
      enchant.Game.instance.input.leftUp = true
    })
    enchant.Core.instance.addEventListener("rightbuttonup", function(e) {
      enchant.Game.instance.input.rightUp = true
    })
    enchant.Core.instance.addEventListener("upbuttonup", function(e) {
      enchant.Game.instance.input.upUp = true
    })
    enchant.Core.instance.addEventListener("downbuttonup", function(e) {
      enchant.Game.instance.input.downUp = true
    })

    //follow player
    game.addEventListener('enterframe', function(e) {
      if(game.player && game.map.width > game.width && !scoreTable) {
        var x = Math.floor(Math.min((game.width  - 16) / 2 - game.player.x, 0));
        var y = Math.floor(Math.min((game.height - 16) / 2 - game.player.y, 0));
        x = Math.max(game.width,  x + map.width)  - map.width;
        y = Math.max(game.height, y + map.height) - map.height;
        if(mapStage.x != x || mapStage.y != y) {
          mapStage.x = playerStage.x = shadows.x = x;
          mapStage.y = playerStage.y = shadows.y = y;
          if(floor.draw) {
            floor.x = x
            floor.y = y
            floor.draw()
          }
        }
        
      }
      if(shadows) {
        shadows.onEnterFrame()
      }
    });

    game.onNewGame = function() {
      enableShadows()
      if(scoreTable) {
        scoreTable.remove()
        scoreTable = null
      }
    }
    game.players = {}
    game.addPlayer = function(player) {
      if(!game.player) {
        game.players[player.id] = game.player = new players.Player(player.color)
        shadows.addLight(game.player.light)
        playerStage.addChild(game.player)
      }
      game.player.reset()
      game.player.x = player.x
      game.player.y = player.y
      game.player._updateCoordinate()
      game.player.update(player)
      game.player.light.refresh()
    }
    game.addEnemy = function(enemy) {
      game.players[enemy.id] = new players.Enemy(enemy.color)
      game.players[enemy.id].update(enemy)
      playerStage.insertBefore(game.players[enemy.id], game.player)
      game.players[enemy.id]._updateCoordinate()
      game.hud.texts.add(enemy.name + " has joined the game")
    }
    game.addEnemies = function(enemies) {
      for(var i=0; i<enemies.length; i++) {
        game.addEnemy(enemies[i])
      }
    }
    game.trashPlayer = function(id) {
      var player = game.players[id]
      playerStage.removeChild(player)
      game.players[id] = null
      delete game.players[id]
      game.hud.texts.add(player.name + " has left the game")
    }
    game.setMap = function(map) {
      
      walls = maps.walls(map.map)
      game.map = walls
      
      floor = maps.floor(map.map, walls.width, walls.height)
      if(!floor.div)
        mapStage.addChild(floor)
      game.floor = floor

      mapStage.addChild(walls)

      decorations = maps.decorations(map.map)
      mapStage.addChild(decorations)
      game.decorations = decorations

      for(var i=0; i<map.pills.length; i++) {
        this.newPill(map.pills[i])
      }

      shadows.setWalls(walls)

      if(game.map.width < game.width) {
        mapStage.x = playerStage.x = shadows.x = Math.floor((game.width - walls.width)/2);
        mapStage.y = playerStage.y = shadows.y = Math.floor((game.height - walls.height)/2);
      } else {
        shadows.x = mapStage.x
        shadows.y = mapStage.y
      }
    }
    game.endGame = function(result) {
      game.hud.time.time = 0
      shadows.reset()
      if(walls) {
        walls.remove()
        floor.remove()
        decorations.remove()
        walls = floor = decorations = null
      }

      if(scoreTable) {
        scoreTable.remove()
        scoreTable = null
      }
      //clearpills
      var nodes = playerStage.childNodes
      for(var i=0; i<nodes.length; i++) {
        var node = nodes[i]
        if(node.applyEffect) {
          node.remove()
          i--
        }
      }

      for(var i in game.players) {
        var player = game.players[i]
        for(var type in player.pillEffects) {
          player.clearPillEffect(type)
        }
      }

      scoreTable = new ui.ScoreTable(result)
    }
    game.reset = function() {
      game.shadows.reset()
    }
    game.insult = function(enemyId) {
      game.assets[res["laugh" + Math.ceil(Math.random()*6)]].play()
      new ui.Insult(game.player, game.players[enemyId])
      new ui.Quote()
    }
    game.newPill = function(pill) {
      var p = pills.create(pill)
      playerStage.addChild(p)
      p._updateCoordinate()
    }
    game.consumePill = function(playerId, pillId) {
      var nodes = playerStage.childNodes
      for(var i=0, l=nodes.length; i<l; i++) {
        var node = nodes[i]
        if(node.id == pillId) {
          game.players[playerId].consumePill(node)
          node.remove()
          break;
        }
      }
    }
    game.delPill = function(pillId) {
      var nodes = playerStage.childNodes
      for(var i=0, l=nodes.length; i<l; i++) {
        var node = nodes[i]
        if(node.id == pillId) {
          playerStage.removeChild(node)
          break;
        }
      }
    }

    Connection.init();

  }

  return {

    create: function() {
      var width = window.innerWidth < 800 && enchant.ENV.TOUCH_ENABLED ? 400 : 800,
          height = window.innerHeight < 600 && enchant.ENV.TOUCH_ENABLED ? 300 : 600,
          scale = 1
      game = new Game(width, height)
      //game.scale = window.innerWidth < 800 && enchant.ENV.TOUCH_ENABLED  ? 0.2 : 1
      //game.scale = scale
      //game.rootScene.scaleX = game.rootScene.scaleY = scale
      game.fps = 20;
      for(var key in res) {
        game.preload(res[key]);
      }
      game.onload = onLoad
      game.start();
    }

  }

})