define(["resources", 
        "maps", 
        'pills',
        "players",
        "shadows",
        "ui",
        "connection"], function(res, maps, pills, players, Shadows, ui, Connection) {

  let game,
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
    // playerStage = mapStage
    
    game.playerStage = playerStage
    game.player = null

    shadows = new Shadows(game.width, game.height)
    game.shadows = shadows
    //game.rootScene.addChild(shadows)

    const time = new ui.TimeLabel(0),
          texts = new ui.ActiveTextList(),
          wedgieScoreLabel = new ui.ScoreLabel("", game.width - 105, 15, 0, "wedgie"),
          banzaiScoreLabel = new ui.ScoreLabel("", game.width - 65, 15, 0, "banzai")
    game.hud = {
      lag: document.getElementById('lagValue'),
      texts,
      wedgieScoreLabel,
      banzaiScoreLabel,
      time
    }

    if(enchant.ENV.TOUCH_ENABLED) {
      const pad = new ui.TouchArrows(),
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
    enchant.Core.instance.addEventListener("abuttonup", e => {
      enchant.Game.instance.input.aUp = true
    })
    enchant.Core.instance.addEventListener("bbuttonup", e => {
      enchant.Game.instance.input.bUp = true
    })
    enchant.Core.instance.addEventListener("leftbuttonup", e => {
      enchant.Game.instance.input.leftUp = true
    })
    enchant.Core.instance.addEventListener("rightbuttonup", e => {
      enchant.Game.instance.input.rightUp = true
    })
    enchant.Core.instance.addEventListener("upbuttonup", e => {
      enchant.Game.instance.input.upUp = true
    })
    enchant.Core.instance.addEventListener("downbuttonup", e => {
      enchant.Game.instance.input.downUp = true
    })

    game.addEventListener('enterframe', () => {
      if(shadows) {
        shadows.onEnterFrame()
      }
    })

    // follow player
    game.addEventListener('enterframe', function(e) {
      if(game.player && game.map.width > game.width && !scoreTable) {
        let x = Math.floor(Math.min((game.width) / 2 - game.player.x, 0))
        let y = Math.floor(Math.min((game.height) / 2 - game.player.y, 0))
        x = Math.max(game.width,  x + game.map.width)  - game.map.width
        y = Math.max(game.height, y + game.map.height) - game.map.height
        if(mapStage.x != x || mapStage.y != y) {
          mapStage.x = playerStage.x = shadows.x = x;
          mapStage.y = playerStage.y = shadows.y = y;
        }
      }
    });

    game.newGame = function(map, gameTime, player) {
      game.reset()
      game.setMap(map)
      game.hud.time.time = gameTime / 1000
      game.hud.wedgieScoreLabel.score = 0
      game.hud.banzaiScoreLabel.score = 0
      game.addPlayer(player)
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
    game.addEnemies = enemies => enemies.map(game.addEnemy)
    game.trashPlayer = function(id) {
      const player = game.players[id]
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

      map.pills.map(this.newPill)

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
      playerStage.childNodes
        .filter(node => node.applyEffect)
        .map(node => node.remove())
      
      for(let i in game.players) {
        let player = game.players[i]
        for(let type in player.pillEffects) {
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
      const p = pills.create(pill)
      playerStage.addChild(p)
      p._updateCoordinate()
    }
    game.consumePill = function(playerId, pillId) {
      const node = playerStage.childNodes.find(node => node.id === pillId)
      if (node) {
        game.players[playerId].consumePill(node)
        node.remove()
      }
    }
    game.delPill = function(pillId) {
      const node = playerStage.childNodes.find(node => node.id === pillId)
      if (node) playerStage.removeChild(node)
    }

    Connection.init()

  }

  return {

    create: function() {
      const width = window.innerWidth < 800 && enchant.ENV.TOUCH_ENABLED ? 400 : 800,
            height = window.innerHeight < 600 && enchant.ENV.TOUCH_ENABLED ? 300 : 600,
            scale = 1
      game = new Game(width, height)
      //game.scale = window.innerWidth < 800 && enchant.ENV.TOUCH_ENABLED  ? 0.2 : 1
      //game.scale = scale
      //game.rootScene.scaleX = game.rootScene.scaleY = scale
      game.fps = 60;
      for(let key in res) {
        game.preload(res[key])
      }
      game.onload = onLoad
      game.start()
    }

  }

})