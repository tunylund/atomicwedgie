import resources from './resources.mjs'
import { buildFloor, buildWalls, buildDecorations } from './maps.mjs'
import createPill from './pills.mjs'
import { Enemy, Player } from './players.mjs'
import Shadows from './shadows.mjs'
import ui from './ui.mjs'
import Connection from './connection.mjs'

class AtomicWedgie extends enchant.Game {

  constructor(width, height) {
    super(width, height)
    this.fps = 60;
    this._players = {}
    this._shadows = new Shadows(this.width, this.height)
    
    this.addEventListener(enchant.Event.LOAD, this._onLoad)
    this.addEventListener(enchant.Event.ENTER_FRAME, this._followPlayer)
    this.addEventListener(enchant.Event.ENTER_FRAME, this._refreshShadows)
    this.keybind(65, 'a')
    this.keybind(83, 'b')
    this.addEventListener(enchant.Event.A_BUTTON_UP, e => this.input.aUp = true)
    this.addEventListener(enchant.Event.B_BUTTON_UP, e => this.input.bUp = true)
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
  get mapStage () { return this.currentScene.childNodes[0] }
  get playerStage () { return this.currentScene.childNodes[1] }
  get hud () { return this._hud }
  get decorations () { return this._decorations }
  get map () { return this._map }
  
  set map (map) {
    this._map = buildWalls(map.map)
    this.mapStage.addChild(buildFloor(map.map, this.map.width, this.map.height))
    this.mapStage.addChild(this.map)

    this._decorations = buildDecorations(map.map)
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
    if(this.shadows && this.player) {
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

  newGame (map, gameTime, player, enemies) {
    const scene = new enchant.CanvasScene()
    scene.addChild(new Group())
    scene.addChild(new Group())
    this.pushScene(scene)

    this.shadows.reset()

    for (let i in this.hud) {
      this.hud[i].replaceOnDom && this.hud[i].replaceOnDom()
    }

    this.map = map
    this.hud.time.time = gameTime / 1000
    this.hud.wedgieScoreLabel.score = 0
    this.hud.banzaiScoreLabel.score = 0
    this.addPlayer(player)
    this.addEnemies(enemies)
    this.removeScoreTable()
  }
  
  endGame (result) {
    const scene = this.popScene()
    scene._layers.Canvas.remove()

    this.hud.time.time = 0
    this.shadows.reset()
    this.map.reset()

    this._map = null
    this._player = null
    this.removeScoreTable()
    
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
      this.players[player.id] = this._player = new Player(player.color)
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
    this.players[enemy.id] = new Enemy(enemy.color)
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
    const p = createPill(pill)
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
    this.assets[resources["laugh" + Math.ceil(Math.random()*6)]].play()
    new ui.Insult(this.player, this.players[enemyId])
    new ui.Quote()
  }

}

export default function createGame () {
  const width = window.innerWidth < 800 && enchant.ENV.TOUCH_ENABLED ? 400 : 800,
        height = window.innerHeight < 600 && enchant.ENV.TOUCH_ENABLED ? 300 : 600,
        scale = 1
  const game = new AtomicWedgie(width, height)
  for(let key in resources) {
    game.preload(resources[key])
  }
  game.start()
}
