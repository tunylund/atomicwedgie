import { draw } from 'tiny-game-engine/lib/index'
import { Score } from '../../types/types'

function drawTime(timeUntilEndGame: number) {
  draw((ctx, cw, ch) => {
    ctx.font = '12px Arial'
    ctx.fillStyle = 'white'
    ctx.fillText(`time: ${Math.max(Math.floor(timeUntilEndGame), 0)}`, -cw + 15, -ch + 25)
  })
}

function drawCurrentScore(scores: Score[], myId: string) {
  const score = scores.find(score => score.id === myId) || {
    wedgieCount: 0,
    banzaiCount: 0,
    score: 0
  }
  const text = `score: ${score.wedgieCount} ` +
                `wedgie: ${score.wedgieCount} ` + 
                `banzai: ${score.banzaiCount}`
  draw((ctx, cw, ch) => {
    ctx.font = '12px Arial'
    ctx.fillStyle = 'white'
    ctx.fillText(text, cw - ctx.measureText(text).width - 15, -ch + 25)
  })
}

export function drawHud(timeUntilEndGame: number, scores: Score[], myId: string) {
  drawTime(timeUntilEndGame)
  drawCurrentScore(scores, myId)
}
