import { draw } from 'tiny-game-engine/lib/index'
import { Score, Insult } from '../../types/types'

function drawTime(timeUntilEndGame: number) {
  draw((ctx, cw, ch) => {
    ctx.font = '12px Arial'
    ctx.fillStyle = 'white'
    ctx.fillText(`time left: ${Math.max(Math.floor(timeUntilEndGame), 0)}`, -cw + 15, -ch + 25)
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

function drawInsults(insults: Insult[], myId: string) {
  insults.filter(i => i.target === myId).map(({text, quote}) => {
    draw((ctx, cw, ch) => {
      ctx.font = '18px Arial'
      ctx.fillStyle = 'red'
      ctx.fillText(text, -ctx.measureText(text).width/2, 0)
      ctx.font = 'italic 14px Arial'
      ctx.fillStyle = 'white'
      ctx.fillText(quote, -ctx.measureText(quote).width/2, 24)
    })
  })
  insults.filter(i => i.target !== myId).map(({text, targetName}, ix) => {
    draw((ctx, cw, ch) => {
      ctx.font = '14px Arial'
      ctx.fillStyle = 'white'
      ctx.fillText(text.replace(/you/ig, targetName), -cw + 20, ch - ix * 16 - 20)
    })
  })
}

export function drawHud(timeUntilEndGame: number, scores: Score[], myId: string, insults: Insult[]) {
  drawTime(timeUntilEndGame)
  drawCurrentScore(scores, myId)
  drawInsults(insults, myId)
}
