import { GameState } from '../../types/types'
import { loop } from 'tiny-game-engine'
import { update, state, off, on, ACTIONS, clients } from 'shared-state-server'
import { randomMap, buildWalls, buildPolygons } from './maps'
import { tryToCreatePill, tryToConsumePills } from './pills'
import { resetPlayer, buildScore, Input, advanceEffects, movePlayer, advanceDeathTimer, updateMode, hitOtherPlayers } from './players'
import { v4 as uuid } from 'uuid'

export function addClient(id: string) {
  if (state<GameState>().players.length === 0) queueGameStart()
  on(id, ACTIONS.OPEN, () => {
    const current = state<GameState>()
    addPlayer(id, current)
    update(current)   
  })
  on(id, ACTIONS.CLOSE, () => removePlayer(id))
  on(id, 'character', ({name, color}: any) => {
    const current = state<GameState>()
    current.characters[id] = {name, color}
    const player = current.players.find(p => p.id === id)
    current.scores
      .filter(s => s.id === id)
      .map(score => score.name = name)
    if (player) {
      player.name = name
      player.color = color
    }
    update(current)
  })
  on(id, 'input', (input: Input) => inputs.set(id, input))
  on(id, 'reset-attack', () => (inputs.get(id) || {resetAttack: false}).resetAttack = true)
}

function queueGameStart() {
  const current = state<GameState>()
  resetGame(current)
  update(current)
  startGameLoop()
}

const inputs = new Map<string, Input>()

function resetGame(current: GameState) {
  const map = randomMap()
  Object.assign(current, newGameState())
  clients().map(id => addPlayer(id, current))
}

export function newGameState(): GameState {
  const map = randomMap()
  return {
    round: uuid(),
    startTime: Date.now(),
    timeUntilEndGame: 60 * 1000,
    timeUntilNextGame: 0,
    players: [],
    scores: [],
    insults: [],
    pills: [],
    characters: {},
    map,
    collisionPolygons: buildWalls(map).concat(buildPolygons(map))
  }
}

function addPlayer(id: string, current: GameState) {
  const character = current.characters[id] || {name: 'someone', color: 'green'}
  const player = resetPlayer(id, character, current.map, current.collisionPolygons)
  const score = buildScore(player)
  current.players.push(player)
  current.scores.push(score)
}

function removePlayer(id: string) {
  const current = state<GameState>()
  current.players.splice(current.players.findIndex(p => p.id === id), 1)
  update(current)
  off(id)

  if (current.players.length === 0 && stopGameLoop) stopGameLoop()
}

let stopGameLoop: (() => void)|undefined
function startGameLoop() {
  if (stopGameLoop) stopGameLoop()

  const stopLoop = loop((step, gameTime) => {
    let current = advanceTimers(state<GameState>(), step)
    if (current.timeUntilEndGame > 0) {
      current = advanceGame(current, step)
    }
  }, {
    requestAnimationFrame: (cb) => setTimeout(cb, 1000/120),
    cancelAnimationFrame: clearTimeout
  })

  const updateInterval = setInterval(() => update(state()), 1000/60)

  stopGameLoop = () => {
    stopLoop()
    clearInterval(updateInterval)
  }
}

function advanceGame(current: GameState, step: number): GameState {
  const newPills = tryToCreatePill(current.pills, current.map, current.collisionPolygons)
  current.pills = current.pills.concat(newPills)
  current.players.map(player => {
    movePlayer(player, inputs.get(player.id), current.collisionPolygons, step)
    current.pills = tryToConsumePills(player, current.pills)
    updateMode(player, inputs.get(player.id), step)
    hitOtherPlayers(player, current.players, current.scores, current.insults)
    advanceEffects(player, step)
    advanceDeathTimer(player, current.map, current.collisionPolygons, step)
  })
  current.insults.map(insult => insult.life -= step)
  current.insults = current.insults.filter(i => i.life > 0)
  return current
}

function advanceTimers(current: GameState, step: number): GameState {
  current.timeUntilNextGame -= step
  current.timeUntilEndGame -= step
  const timeToSwitch = current.timeUntilNextGame <= 0 && current.timeUntilEndGame <= 0
  const resultsAreVisible = current.timeUntilEndGame < current.timeUntilNextGame
  if (timeToSwitch) {
    if (resultsAreVisible) resetGame(current)
    else current.timeUntilNextGame = 15 * 1000
  }
  return current
}

export function status() {
  const current = state<GameState>()
  return {
    players: current.players.map(p => ({color: p.color})),
    startTime: current.startTime
  }
}
