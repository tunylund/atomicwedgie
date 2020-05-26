import { loop, draw, xyz, zero } from 'tiny-game-engine/lib/index'
import { drawHud } from './ui'
import { drawMap } from './maps'
import { drawPlayers, animatePlayers } from './players'
import { drawShadows, buildShadowCaster, ShadowCaster } from './shadows'
import { drawPills } from './pills'
import { GameState, Player, Score } from '../../types/types'
import { state, ACTIONS, on } from 'shared-state-client/dist/index'
import { drawScores } from './results'

function centerMapOrPlayerOrBindToEdge(availableSpace: number, mapSize: number, playerPos: number) {
  const mapFitsOnScreen = availableSpace > mapSize
  const playerIsCloseToFarEdge = mapSize - playerPos < availableSpace/2
  const playerIsCloseToNearEdge = playerPos < availableSpace/2
  return mapFitsOnScreen ? -mapSize/2 :
    playerIsCloseToFarEdge ? -(mapSize - availableSpace/2) :
    playerIsCloseToNearEdge ? -availableSpace/2 :
    -playerPos
}

export function startDrawingGame(myId: string) {
  let shadowCaster: ShadowCaster
  on(ACTIONS.INIT, (id: string) => myId = id )

  const stopAnimationLoop = loop((step) => {
    const { players, map, round } = state<GameState>()
    const protagonist = players.find(p => p.id === myId)
    if (shadowCaster?.round !== round) shadowCaster = buildShadowCaster(map, round)
    makeLightsFollowPlayer(shadowCaster, protagonist)
    animatePlayers(players, step)
  })

  const stopDrawLoop = loop((step, gameTime) => {
    const { map, players, pills, timeUntilEndGame, timeUntilNextGame, scores } = state<GameState>()

    const protagonist = players.find(p => p.id === myId)
    const protagonistPos = protagonist?.pos.cor || zero
    const mapWidth = map.tiles[0].length * map.tileSize
    const mapHeight = map.tiles.length * map.tileSize
    const offset = xyz(
      centerMapOrPlayerOrBindToEdge(window.innerWidth, mapWidth, protagonistPos.x),
      centerMapOrPlayerOrBindToEdge(window.innerHeight, mapHeight, protagonistPos.y))
    drawBackground()
    drawMap(map, offset)
    drawPills(pills, offset, shadowCaster)
    drawPlayers(myId, players, offset, shadowCaster)
    drawShadows(shadowCaster, offset)
    drawHud(timeUntilEndGame, scores, myId)
    tryDrawResults(timeUntilNextGame, scores)
  })

  return () => {
    stopAnimationLoop()
    stopDrawLoop()
  }
}

let clearResults: (() => void)|void
function tryDrawResults(timeUntilNextGame: number, scores: Score[]) {
  if (!clearResults && timeUntilNextGame >= 0)
    clearResults = drawScores(timeUntilNextGame, scores)
  if (clearResults && timeUntilNextGame <= 0)
    clearResults = clearResults()
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
