import { preload } from './assets'
import { drawGame } from './game'
import { Map } from './maps'
import { Player, Modes } from './players'
import { Pill } from './pills'
import { Effect, buildRingEffect, buildPulseEffect, buildTrailEffect } from './effects'
import { Score } from './ui'
import { position, xyz, vector, entity } from 'tiny-game-engine/lib/index'
import { drawScores } from './results'

export interface GameState {
  players: Player[]
  pills: Pill[]
  effects: Effect[]
  map: Map
  timeUntilEndGame: number
  timeUntilNextGame: number
  scores: Score[]
}

const gameState: GameState = {
  timeUntilEndGame: 0,
  timeUntilNextGame: 15,
  players: [{
    id: 'some-id',
    name: 'someone',
    color: 'green',
    pos: position(14 * 16, 33 * 16, 0, 1, 1, 0),
    dim: xyz(32, 32, 32),
    dir: vector(-Math.PI/1.25, 1),
    mode: Modes.Stand,
    modeCount: 1
  }],
  scores: [{
    id: 'some-id',
    name: 'some-name',
    wedgieCount: 12,
    wedgiedCount: 1,
    banzaiCount: 14,
    banzaidCount: 2,
    score: 10
  }],
  pills: [{
    ...entity(position(7 * 16, 30 * 16)),
    id: 'some-id',
    asset: 'pillRed'
  }],
  effects: [
    buildRingEffect('some-id'),
    buildPulseEffect('some-id'),
    buildTrailEffect('another-id')
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

export default async function createGame() {
  const { timeUntilEndGame, scores } = gameState
  await preload()
  // connect()
  drawGame(gameState)
  const clearResults = drawScores(timeUntilEndGame, scores)
}

createGame()