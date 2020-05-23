import { loop, draw, xyz, zero } from 'tiny-game-engine/lib/index'
import { drawHud } from './ui'
import { drawMap } from './maps'
import { drawPlayers, Player, animatePlayers } from './players'
import { drawShadows, buildShadowCaster, ShadowCaster } from './shadows'
import { drawPills } from './pills'
import { Effect, drawEffects } from './effects'
import { GameState } from './main'

function centerMapOrPlayerOrBindToEdge(availableSpace: number, mapSize: number, playerPos: number) {
  const mapFitsOnScreen = availableSpace > mapSize
  const playerIsCloseToFarEdge = mapSize - playerPos < availableSpace/2
  const playerIsCloseToNearEdge = playerPos < availableSpace/2
  return mapFitsOnScreen ? -mapSize/2 :
    playerIsCloseToFarEdge ? -(mapSize - availableSpace/2) :
    playerIsCloseToNearEdge ? -availableSpace/2 :
    -playerPos
}

export function drawGame(gameState: GameState) {

  const shadowCaster = buildShadowCaster(gameState.map)
  
  const myId = 'some-id'

  const stopAnimationLoop = loop((step) => {
    const { players, effects } = gameState
    const protagonist = players.find(p => p.id === myId)
    makeLightsFollowPlayer(shadowCaster, protagonist)
    animatePlayers(players, step)
    animateEffects(effects, players, step)
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
    drawEffects(effects, offset, shadowCaster, myId)
    drawPlayers(myId, players, offset, shadowCaster)
    drawPills(pills, offset, shadowCaster)
    drawShadows(shadowCaster, offset)
    drawHud(timeUntilEndGame, scores, myId)
  })

  return () => {
    stopAnimationLoop()
    stopDrawLoop()
  }
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

function animateEffects(effects: Effect[], players: Player[], step: number) {
  effects.map(e => {
    e.cor = players.find(p => p.id === e.playerId)?.pos.cor || zero
    e.age += step
  })
}
