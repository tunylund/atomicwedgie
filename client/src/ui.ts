import { draw } from 'tiny-game-engine/lib/index'
import { Score, Insult, Player } from '../../types/types'

function drawTime(timeUntilEndGame: number) {
  draw((ctx, cw, ch) => {
    ctx.font = '12px Arial'
    ctx.fillStyle = 'white'
    ctx.fillText(`time left: ${Math.max(Math.floor(timeUntilEndGame), 0)}`, -cw + 15, -ch + 25)
  })
}

function drawLagStatistics(lagStatistics: {[id:string]: {lag:number}}, players: Player[], myId: string) {
  draw((ctx, cw, ch) => {
    ctx.font = '12px Arial'
    ctx.fillStyle = 'white'
    ctx.fillText(`lag statistics:`, -cw + 15, -ch + 55)
    Object.entries(lagStatistics).map(([id, {lag}], ix) => {
      const name = players.find(p => p.id === id)?.name || '--unknown--'
      ctx.fillStyle = id === myId ? 'white' : 'hsl(0,0%,75%)'
      ctx.fillText(`${name}: ${lag}ms`, -cw + 15, -ch + 75 + 20 * ix)
    })
  })
}

function drawControls() {
  draw((ctx, cw, ch) => {
    ctx.font = '12px Arial'
    ctx.fillStyle = 'white'
    const texts = [
      '←↑→ move', `🅐 wedgie/banzai`, `🅢 clubs out`, 'Wedgie only works from',
      'behind and banzai is visible', 'for all.',
      '5 points per wedgie',
      '2 points per banzai']
    const w = texts.map(text => ctx.measureText(text).width).sort((a, b) => b-a)[0]
    texts.map((text, ix) => {
      ctx.fillText(text, cw - w - 15, -ch + 45 + 20 * ix)
    })
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

export function drawHud(timeUntilEndGame: number, scores: Score[], myId: string, insults: Insult[], lagStatistics: {}, players: Player[]) {
  drawTime(timeUntilEndGame)
  drawLagStatistics(lagStatistics, players, myId)
  drawCurrentScore(scores, myId)
  drawInsults(insults, myId)
  drawControls()
}
