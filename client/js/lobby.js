(function () {

  function showTakenPlayers(players) {
    for(let player of players) {
      document
        .querySelector(`[name=color][value=${player.color}]`)
        .parentNode().classList.add('taken')
    }
  }

  function showGameTime(startTime) {
    if(!startTime) return;
    const runtimeEl = document.querySelector("#runtime")
    const refreshRuntime = () => {
      const now = new Date().getTime(),
            runtime = now - startTime,
            days = Math.floor(runtime / 1000 / 60 / 60 / 24, 10),
            hours = Math.floor(runtime / 1000 / 60 / 60 % 24),
            minutes = Math.floor(runtime / 1000 / 60 % 60),
            seconds = Math.floor(runtime / 1000 % 60)
      
      

      runtimeEl.html(
        (days > 0 ? days + " days " : "") 
        + (hours > 0 ? hours + "h " : "" )
        + minutes + "min " + seconds + "s");
    }
    setInterval(refreshRuntime, 1000)
  }

  fetch('/status')
    .then(res => res.json())
    .then(status => {
      showTakenPlayers(status.players)
      showGameTime(status.startTime)
    })
    .catch(err => {
      document.querySelector("#rooms").html(0);
      document.querySelector("#players").html(0);
      document.querySelector("#runtime").html("Server is down at the moment");  
    })

  document.querySelector('#join').addEventListener('click', () => {
    localStorage.setItem("character", JSON.stringify({
      color: document.querySelector("[name=color]:checked").value,
      name: document.querySelector("[name=name]").value
    }))
    
    window.location = "game.html"
  })

  const c = localStorage.getItem("character")
  if (c) {
    const character = JSON.parse(c)
    const input = document.querySelector(`[name=color][value=${character.color}]`)
    input.checked = true
    input.dispatchEvent(new Event('change'))
    document.querySelector('[name=name]').value = character.name
  }

}());
