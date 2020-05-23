import { draw } from 'tiny-game-engine/lib/index'

function drawTime(timeUntilEndGame: number) {
  draw((ctx, cw, ch) => {
    ctx.font = '12px Arial'
    ctx.fillStyle = 'white'
    ctx.fillText(`time: ${timeUntilEndGame}`, -cw + 15, -ch + 25)
  })
}

export interface Score {
  id: string
  name: string
  wedgieCount: number
  wedgiedCount: number
  banzaiCount: number
  banzaidCount: number
  score: number
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
