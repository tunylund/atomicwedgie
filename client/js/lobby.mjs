const q = document.querySelector.bind(document)

function showTakenPlayers(players) {
  document.querySelectorAll('[name=color]').forEach(el => {
    el.parentNode.classList.remove('taken')
  })
  players
    .filter(p => !!p)
    .map(player => q(`[name=color][value=${player.color}]`))
    .forEach(el => {
      el.checked = false
      el.parentNode.classList.add('taken')
    })
  if(players.length > 0) q('.taken-info').style.display = 'block'
  else q('.taken-info').style.display = 'none'
}

function asDuration(startTime) {
  if(startTime) {
    const now = new Date().getTime(),
          runtime = now - startTime,
          days = Math.floor(runtime / 1000 / 60 / 60 / 24, 10),
          hours = Math.floor(runtime / 1000 / 60 / 60 % 24),
          minutes = Math.floor(runtime / 1000 / 60 % 60),
          seconds = Math.floor(runtime / 1000 % 60)
    
    return 'The current game has been running for: ' +
      (days > 0 ? days + " days " : "") 
      + (hours > 0 ? hours + "h " : "" )
      + minutes + "min " + seconds + "s"
  } else {
    return 'No one is playing yet'
  } 
}

function showGameTime(startTime) {
  q("#runtime").innerHTML = asDuration(startTime)
}

function joinGame() {
  localStorage.setItem("character", JSON.stringify({
    color: q("[name=color]:checked").value,
    name: q("[name=name]").value
  }))
  
  const currentUrl = new URL(location.toString())
  const host = currentUrl.searchParams.get('host') || currentUrl.host
  window.location = "game.html?host=" + host
}

function selectPreviouslySelectedColor() {
  const c = localStorage.getItem("character")
  if (c) {
    const character = JSON.parse(c)
    const input = q(`[name=color][value=${character.color}]`)
    input.checked = true
    input.dispatchEvent(new Event('change'))
    q('[name=name]').value = character.name
  }
}

async function refreshGameState() {
  try {
    const currentUrl = new URL(location.toString())
    const host = currentUrl.searchParams.get('host') || currentUrl.host
    const response = await fetch(`${currentUrl.protocol}//${host}/status`, {mode: 'cors'})
    const status = await response.json()
    showTakenPlayers(status.players)
    showGameTime(status.startTime)
  } catch(err) {
    console.error(err)
  } finally {
    setTimeout(refreshGameState, 1000)
  }
}

selectPreviouslySelectedColor()
q('#join').addEventListener('click', joinGame)
refreshGameState()
