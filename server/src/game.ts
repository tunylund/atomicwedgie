import { GameState } from '../../types/types'
import { loop, Entity } from 'tiny-game-engine'
import { update, state, off, on, ACTIONS } from 'shared-state-server'
import { randomMap, buildWalls } from './maps'
import { tryToCreatePill, tryToConsumePills } from './pills'
import { resetPlayer, buildScore, Input, advanceEffects, movePlayer, advanceDeathTimer, updateMode, hitOtherPlayers } from './players'
import { clearImmediate } from 'timers'
import { v4 as uuid } from 'uuid'

const inputs = new Map<string, Input>()
export function applyInput(id: string, input: Input) {
  inputs.set(id, input)
}

export function addClient(id: string) {
  if (state<GameState>().players.length === 0) {
    resetGame()
    startGameLoop()
  }
  on(id, ACTIONS.OPEN, () => addPlayer(id))
  on(id, ACTIONS.CLOSE, () => removePlayer(id))
  on(id, 'input', (input: Input) => inputs.set(id, input))
  on(id, 'reset-attack', () => (inputs.get(id) || {resetAttack: false}).resetAttack = true)
}

let wallEntities: Entity[] = []
function resetGame() {
  const current = state<GameState>()
  current.round = uuid()
  current.map = randomMap()
  current.players = []
  current.scores = []
  current.clients.map(addPlayer)
  current.timeUntilEndGame = 60
  wallEntities = buildWalls(current.map)
  update(current)
}

function addPlayer(id: string) {
  const current = state<GameState>()
  const player = resetPlayer({ id, name: 'someone', color: 'green' }, current.map)
  current.players.push(player)
  current.scores.push(buildScore(player))
}

function removePlayer(id: string) {
  const current = state<GameState>()
  current.players.splice(current.players.findIndex(p => p.id === id), 1)
  update(current)
  off(id)

  if (current.players.length === 0 && stopGameLoop) stopGameLoop()
}

let stopGameLoop: () => void
function startGameLoop() {
  const stopLoop = loop((step, gameTime) => {
    let current = advanceTimers(state<GameState>(), step)
    if (current.timeUntilEndGame > 0) {
      current = advanceGame(current, step)
    }
  }, {
    requestAnimationFrame: setImmediate,
    cancelAnimationFrame: clearImmediate
  })
  const updateInterval = setInterval(() => update(state()), 1000/60)

  stopGameLoop = () => {
    stopLoop()
    clearInterval(updateInterval)
  }
}

function advanceGame(current: GameState, step: number): GameState {
  const newPills = tryToCreatePill(current.pills, current.map)
  current.pills = current.pills.concat(newPills)
  current.players.map(player => {
    movePlayer(player, inputs.get(player.id), wallEntities, step)
    current.pills = tryToConsumePills(player, current.pills)
    updateMode(player, inputs.get(player.id))
    hitOtherPlayers(player, current.players)
    advanceEffects(player, step)
    advanceDeathTimer(player, current.map, step)
  })
  return current
}

function advanceTimers(current: GameState, step: number): GameState {
  current.timeUntilNextGame -= step
  current.timeUntilEndGame -= step
  const timeToSwitch = current.timeUntilNextGame <= 0 && current.timeUntilEndGame <= 0
  const resultsAreVisible = current.timeUntilEndGame < current.timeUntilNextGame
  if (timeToSwitch) {
    if (resultsAreVisible) resetGame()
    else current.timeUntilNextGame = 15
  }
  return current
}

export const initialState: GameState = {
  round: '',
  clients: [],
  lagStatistics: {},
  timeUntilEndGame: 60,
  timeUntilNextGame: 0,
  players: [],
  scores: [],
  pills: [],
  map: randomMap()
}