define(["resources", 
        "maps", 
        'pills',
        "players",
        "shadows",
        "ui",
        "connection"], function(res, maps, pills, players, Shadows, ui, Connection) {

  class AtomicWedgie extends enchant.Game {

    constructor(width, height) {
      super(width, height)
      this.fps = 60;
      this.rootScene.addChild(new Group());
      this.rootScene.addChild(new Group())  
      this._players = {}
      this._shadows = new Shadows(this.width, this.height)
      
      this.addEventListener(enchant.Event.LOAD, this._onLoad)
      this.addEventListener(enchant.Event.ENTER_FRAME, this._followPlayer)
      this.addEventListener(enchant.Event.ENTER_FRAME, this._refreshShadows)
      this.keybind(65, 'a')
      this.keybind(83, 'b')
      this.addEventListener("abuttonup", e => this.input.aUp = true)
      this.addEventListener("bbuttonup", e => this.input.bUp = true)
      this.addEventListener(enchant.Event.LEFT_BUTTON_DOWN, e => this.input.leftUp = true)
      this.addEventListener(enchant.Event.RIGHT_BUTTON_DOWN, e => this.input.rightUp = true)
      this.addEventListener(enchant.Event.UP_BUTTON_DOWN, e => this.input.upUp = true)
      this.addEventListener(enchant.Event.DOWN_BUTTON_DOWN, e => this.input.downUp = true)
    }

    get pills () {
      return this.playerStage.childNodes
        .filter(node => node.applyEffect)
    }

    findPill (id) {
      return this.playerStage.childNodes.find(node => node.id === id)
    }

    get player () { return this._player }
    get players () { return this._players }
    get shadows () { return this._shadows }
    get mapStage () { return this.rootScene.childNodes[0] }
    get playerStage () { return this.rootScene.childNodes[1] }
    get hud () { return this._hud }
    get decorations () { return this._decorations }
    get map () { return this._map }
    
    set map (map) {
      this._map = maps.walls(map.map)
      this.mapStage.addChild(maps.floor(map.map, this.map.width, this.map.height))
      this.mapStage.addChild(this.map)

      this._decorations = maps.decorations(map.map)
      this.mapStage.addChild(this.decorations)

      map.pills.map(p => this.newPill(p))

      this.shadows.setWalls(this.map)

      if(this.map.width < this.width) {
        this.mapStage.x = this.playerStage.x = this.shadows.x = Math.floor((this.width - this.map.width)/2);
        this.mapStage.y = this.playerStage.y = this.shadows.y = Math.floor((this.height - this.map.height)/2);
      } else {
        this.shadows.x = this.mapStage.x
        this.shadows.y = this.mapStage.y
      }
    }

    _followPlayer () {
      let game = this, map = this.map, player = this.player, scoreTable = this._scoreTable
      if(player && map && map.width > this.width && !scoreTable) {
        let x = Math.floor(Math.min((this.width) / 2 - player.x, 0))
        let y = Math.floor(Math.min((this.height) / 2 - player.y, 0))
        x = Math.max(this.width,  x + map.width)  - map.width
        y = Math.max(this.height, y + map.height) - map.height
        if(this.mapStage.x != x || this.mapStage.y != y) {
          this.mapStage.x = this.playerStage.x = this.shadows.x = x;
          this.mapStage.y = this.playerStage.y = this.shadows.y = y;
        }
      }
    }

    _refreshShadows () {
      if(this.shadows) {
        this.shadows.onEnterFrame()
      }
    }

    _onLoad () {
      this._hud = ui.makeHud()
      if(enchant.ENV.TOUCH_ENABLED) {
        ui.makeTouchControls()
      }
   
      Connection.init()
    }

    newGame (map, gameTime, player) {
      this.shadows.reset()
      this.map = map
      this.hud.time.time = gameTime / 1000
      this.hud.wedgieScoreLabel.score = 0
      this.hud.banzaiScoreLabel.score = 0
      this.addPlayer(player)
      this.removeScoreTable()
    }
    
    endGame (result) {
      this.hud.time.time = 0
      this.shadows.reset()
      this.mapStage.childNodes.map(node => node.remove())
      this._map = null
      this.removeScoreTable()
      //clearpills
      this.pills.map(node => node.remove())
      
      for(let i in this.players) {
        let player = this.players[i]
        for(let type in player.pillEffects) {
          player.clearPillEffect(type)
        }
      }

      this._scoreTable = new ui.ScoreTable(result)
    }

    removeScoreTable () {
      if(this._scoreTable) {
        this._scoreTable.remove()
        this._scoreTable = null
      }
    }
    
    addPlayer (player) {
      if(!this.player) {
        this.players[player.id] = this._player = new players.Player(player.color)
        this.shadows.addLight(this.player.light)
        this.playerStage.addChild(this.player)
      }
      this.player.reset()
      this.player.x = player.x
      this.player.y = player.y
      this.player._updateCoordinate()
      this.player.update(player)
      this.player.light.refresh()
    }


    addEnemy (enemy) {
      this.players[enemy.id] = new players.Enemy(enemy.color)
      this.players[enemy.id].update(enemy)
      this.playerStage.insertBefore(this.players[enemy.id], this.player)
      this.players[enemy.id]._updateCoordinate()
      this.hud.texts.add(enemy.name + " has joined the game")
    }

    addEnemies (enemies) {
      enemies.map(e => this.addEnemy(e))
    }

    trashPlayer (id) {
      const player = this.players[id]
      this.playerStage.removeChild(player)
      this.players[id] = null
      delete this.players[id]
      this.hud.texts.add(player.name + " has left the game")
    }
  
    newPill (pill) {
      const p = pills.create(pill)
      this.playerStage.addChild(p)
      p._updateCoordinate()
    }

    delPill (pillId) {
      const node = this.findPill(pillId)
      if (node) this.playerStage.removeChild(node)
    }

    consumePill (playerId, pillId) {
      const node = this.findPill(pillId)
      if (node) {
        this.players[playerId].consumePill(node)
        node.remove()
      }
    }

    insult (enemyId) {
      this.assets[res["laugh" + Math.ceil(Math.random()*6)]].play()
      new ui.Insult(this.player, this.players[enemyId])
      new ui.Quote()
    }

  }

  return {

    create: function() {
      const width = window.innerWidth < 800 && enchant.ENV.TOUCH_ENABLED ? 400 : 800,
            height = window.innerHeight < 600 && enchant.ENV.TOUCH_ENABLED ? 300 : 600,
            scale = 1
      const game = new AtomicWedgie(width, height)
      for(let key in res) {
        game.preload(res[key])
      }
      game.start()
    }

  }

})