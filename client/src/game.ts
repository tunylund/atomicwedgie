import { loop, draw, xyz, zero, entity, position, negone, mul, vector, add } from 'tiny-game-engine/lib/index'
import { preload } from './assets'
import { drawHud, Score } from './ui'
import { drawMap, Map } from './maps'
import { drawPlayers, Player, Modes, animatePlayers } from './players'
import { drawShadows, buildShadowCaster, ShadowCaster } from './shadows'
import { drawPills, Pill } from './pills'
import { Effect, buildRingEffect, drawEffects, buildPulseEffect, buildTrailEffect } from './effects'

interface GameState {
  players: Player[]
  pills: Pill[]
  effects: Effect[]
  map: Map
  timeUntilEndGame: number
  scores: Score[]
}

const gameState: GameState = {
  timeUntilEndGame: 15,
  players: [{
    id: 'some-id',
    color: 'green',
    pos: position(14 * 16, 33 * 16, 0, 1, 1, 0),
    dim: xyz(32, 32, 32),
    dir: vector(-Math.PI/1.25, 1),
    mode: Modes.Stand,
    modeCount: 1
  }],
  scores: [{
    id: 'some-id',
    wedgieCount: 12,
    banzaiCount: 14,
    score: 10
  }],
  pills: [{
    ...entity(position(7 * 16, 30 * 16)),
    id: 'some-id',
    asset: 'pillRed'
  }],
  effects: [
    buildRingEffect(xyz(7 * 16, 30 * 16)),
    buildPulseEffect(xyz(10 * 16, 30 * 16)),
    buildTrailEffect(xyz(12 * 16, 30 * 16))
  ],
  map: {
    "floorAsset": 'largeMarble',
    "tileSize": 16,
    "tiles": [
      ",--------------------------------------------------------------.",
      "|     |     |               |     |                            |",
      "|     |     |               |     |                            |",
      "|     |     |               |     |                            |",
      "|     |     |    Ppppp   Kk |     |                            |",
      "|     |          ppppp   kk |         Bbbbbbbb    Bbbbbbbb     |",
      "|     |          ppppp      |         bbbbbbbb    bbbbbbbb     |",
      "|     |          ppppp      |         bbbbbbbb    bbbbbbbb     |",
      "|     |                  Kk |         bbbbbbbb    bbbbbbbb     |",
      "|           |            kk |     |   bbbbbbbb    bbbbbbbb     |",
      "|           |               |     |                            |",
      "|           |    Ppppp      |     |                            |",
      "|           |    ppppp   Kk |     |                            |",
      "|     |     |    ppppp   kk |     |   Bbbbbbbb    Bbbbbbbb     |",
      "|     |     |    ppppp      |     |   bbbbbbbb    bbbbbbbb     |",
      "|     |     |               |     |   bbbbbbbb    bbbbbbbb     |",
      "|     |     |            Kk |     |   bbbbbbbb    bbbbbbbb     |",
      "|     |     |            kk |     |   bbbbbbbb    bbbbbbbb     |",
      "|     |     |               |     |                            |",
      "|     |     |                     |                            |",
      "|     |     |                     |                            |",
      "|     |     |                     |    Cc          Cc    Cc    |",
      "|     |     |                     |    cc          cc    cc    |",
      "|     |                           |                            |",
      "|     |                     |     ;-----------    -------------|",
      "|     |                     |                                  |",
      "|     ;-------.             |                                  |",
      "|             |             |                                  |",
      "|             |             |                                  |",
      "|             |   Hhhhhh    |                                  |",
      "|             |   hhhhhh    |                                  |",
      "|             ;-------------:                                  |",
      "|    -----.                                                    |",
      "|         |                                                    |",
      "|         |                                                    |",
      "|         |                                                    |",
      "|   Lll   |                                                    |",
      "|   lll   |                                                    |",
      "|   lll   |                                                    |",
      "|   lll   |        ,--------------    ---------------------    |",
      "|   lll   |        |   Ss  Ss  Ss                              |",
      "|   lll   |   |        ss  ss  ss                              |",
      "|   lll   |   |                                                |",
      "|   lll       |                                                |",
      "|             |                         Ww   Ww   Ww   Ww      |",
      "|             |    |                  | ww | ww | ww | ww |    |",
      "|             |    |                  | ww | ww | ww | ww |    |",
      ";--------------------------------------------------------------:"
    ],
  }
}

function centerMapOrPlayerOrBindToEdge(availableSpace: number, mapSize: number, playerPos: number) {
  const mapFitsOnScreen = availableSpace > mapSize
  const playerIsCloseToFarEdge = mapSize - playerPos < availableSpace/2
  const playerIsCloseToNearEdge = playerPos < availableSpace/2
  return mapFitsOnScreen ? -mapSize/2 :
    playerIsCloseToFarEdge ? -(mapSize - availableSpace/2) :
    playerIsCloseToNearEdge ? -availableSpace/2 :
    -playerPos
}

export default async function createGame() {
  await preload()
  // connect()

  const shadowCaster = buildShadowCaster(gameState.map)
  
  const myId = 'some-id'
  const stopAnimationLoop = loop((step) => {
    const { map, players, effects, pills, timeUntilEndGame, scores } = gameState
    const protagonist = players.find(p => p.id === myId)
    makeLightsFollowPlayer(shadowCaster, protagonist)
    animatePlayers(players, step)
    animateEffects(effects, step)
  })

  const stopDrawLoop = loop((step, gameTime) => {
    const { map, players, effects, pills, timeUntilEndGame, scores } = gameState

    const protagonist = players.find(p => p.id === myId)
    const protagonistPos = protagonist?.pos.cor || zero
    const mapWidth = map.tiles[0].length * map.tileSize
    const mapHeight = map.tiles.length * map.tileSize
    const offset = xyz(
      centerMapOrPlayerOrBindToEdge(window.innerWidth, mapWidth, protagonistPos.x),
      centerMapOrPlayerOrBindToEdge(window.innerHeight, mapHeight, protagonistPos.y)
    )
    drawBackground()
    drawMap(map, offset)
    drawEffects(effects, offset, shadowCaster)
    drawPlayers(myId, players, offset, shadowCaster)
    drawPills(pills, offset, shadowCaster)
    drawShadows(shadowCaster, offset)
    drawHud(timeUntilEndGame, scores, myId)
  })
}

function drawBackground() {
  draw((ctx, cw, ch) => {
    ctx.fillStyle = 'black'
    ctx.fillRect(-cw, -ch, cw * 2, ch * 2)
  })
}

function makeLightsFollowPlayer(shadowCaster: ShadowCaster, protagonist?: Player) {
  if (protagonist) {
    shadowCaster.lights.map(l => {
      l.pos = protagonist.pos
      l.dir = protagonist.dir
    })
  }
}

function animateEffects(effects: Effect[], step: number) {
  effects.map(e => e.age += step)
}
