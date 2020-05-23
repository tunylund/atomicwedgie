import { Score } from "./ui"
import { Player } from "./players"
import { goodAdjective, badAdjective } from "./texts"

function getTimer(timeUntilEndGame: number) {
  const startTime = Date.now()
  const div = document.createElement('div')
  div.className = 'timer'
  function setTime() {
    const timeLeft = timeUntilEndGame - Math.floor((Date.now() - startTime) / 1000)
    div.innerHTML = `Next game in: ${Math.max(timeLeft, 0)}s`
  }
  let timerInterval = setInterval(setTime, 100)
  return {
    timer: div,
    timerInterval
  }
}

function getHighestScore(scores: Score[]) {
  const score = scores.sort((a, b) => a.score - b.score)[0]
  return `<div class='score'>
          <span class='score-label'>Highest Score: </span>${score.name}
            <span class='score-value'>${score.score}</span><br>
          with <span class='score-value'>${score.wedgieCount}</span> wedgies and
          <span class='score-value'>${score.banzaiCount}</span> ${goodAdjective()} banzais.
        </div>`
}

function getMostWedgied(scores: Score[]) {
  const score = scores.sort((a, b) => a.score - b.score)[0]
  return `<div class='score'>
          <span class='score-label'>Most Wedgied: </span> ${score.name}<br>
          with <span class='score-value'>${score.wedgiedCount}</span> ${badAdjective()} wedgies pulled on them
        </div>`
}

function getScores(scores: Score[]) {
  return `<table class='scores'>
    ${scores.map(score => {
      return `<tr>
        <td>${score.name}</td>
        <td><span class='score-value'>${score.wedgieCount}</span> wedgies</td>
        <td><span class='score-value'>${score.banzaiCount}</span> banzais</td>
      </tr>`
    })}
  </table>`
}

export function drawScores(timeUntilEndGame: number, scores: Score[]) {
  const {timer, timerInterval} = getTimer(timeUntilEndGame)
  const frag = document.createElement('div')
  frag.className = 'score-container'
  frag.innerHTML = `<div class='score-table'>
    ${getHighestScore(scores)}
    ${getMostWedgied(scores)}
    ${getScores(scores)}
  </div>`
  frag.querySelector('.score-table')?.appendChild(timer)
  document.body.appendChild(frag)
  return () => {
    frag.remove()
    clearInterval(timerInterval)
  }
}