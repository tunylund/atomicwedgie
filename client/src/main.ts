import { connect, on, ACTIONS, send, state } from 'shared-state-client/dist/index'
import { preload } from './assets'
import { startDrawingGame } from './game'
import { buildControls, Controls, draw, loop } from 'tiny-game-engine/lib/index'

function loadAssets() {
  let ready = 0, expected = 1
  const stopLoader = loop(() => {
    draw((ctx, cw, ch) => {
      ctx.fillStyle = '#111'
      ctx.fillRect(-cw, -ch, 2*cw, 2*ch)
      ctx.fillStyle = '#222'
      ctx.fillRect(-cw, -ch, 2*cw/expected * ready, 2*ch)
      const text = `loading ${ready}/${expected}`
      ctx.fillStyle = 'white'
      ctx.font = '16px Arial'
      ctx.fillText(text, -ctx.measureText(text).width/2, 0)
    })
  })

  return preload((r, e) => {
    ready = r
    expected = e
  }).then(() => {
    stopLoader()
  })
}

function showConnectionMessage() {
  return loop((step, gameTime) => {
    draw((ctx, cw, ch) => {
      ctx.fillStyle = '#222'
      ctx.fillRect(-cw, -ch, 2*cw, 2*ch)
      const text = `connecting ${Math.floor(gameTime / 1000)}`
      ctx.fillStyle = 'white'
      ctx.font = '16px Arial'
      ctx.fillText(text, -ctx.measureText(text).width/2, 0)
    })
  })
}

function showError(error: Error) {
  console.error(error)
  return loop((step, gameTime) => {
    draw((ctx, cw, ch) => {
      const msg = error?.message ? error?.message : error
      const support = msg == 'timeout' ? ' ...sometimes reloading helps...' : ''
      const text = `connectivity issues... :( ${msg}${support}`
      ctx.font = '16px Arial'
      const tw = ctx.measureText(text).width      
      ctx.fillStyle = 'white'
      ctx.fillText(text, -tw/2, 24)
    })
  })
}
export default async function createGame() {
  await loadAssets()
  try {
    const currentUrl = new URL(location.toString())
    const host = currentUrl.searchParams.get('host') || currentUrl.host
    const stopConnectMessage = showConnectionMessage()
    const myId = await beginConnection(host)
    stopConnectMessage()
    startDrawingGame(myId)

    let hideError: (() => void)|null
    function onErrorChange(error?: Error) {
      if (hideError) hideError()
      if (error) hideError = showError(error)
    }
    on(ACTIONS.ERROR, onErrorChange)
    on(ACTIONS.CLOSE, onErrorChange)
    on(ACTIONS.STATE_UPDATE, () => onErrorChange())
  
    buildControls(window, (controls: Controls) => {
      send('input', {
        arrowUp: controls.keys.ArrowUp,
        arrowRight: controls.keys.ArrowRight,
        arrowDown: controls.keys.ArrowDown,
        arrowLeft: controls.keys.ArrowLeft,
        attack: controls.keys.KeyA || controls.keys.KeyX,
        banzaiSwich: controls.keys.KeyS || controls.keys.KeyC
      })
    })
  } catch (err) {
    showError(err)
  }
}

function beginConnection(host: string): Promise<string> {
  let myId: string, stateIsReady: boolean
  
  return new Promise((resolve, reject) => {
    function tryResolve() {
      if (myId && stateIsReady) resolve(myId)
    }
    connect(host, {
      iceServers: [{
        "urls": "stun:global.stun.twilio.com:3478?transport=udp"
      },  {
        "username": "2f0e8144029624228d60e5e453efc2ec0dbe71e185559eeed36abf152a06faf1",
        "urls": "turn:global.turn.twilio.com:3478?transport=udp",
        "credential": "XdgWiiLovT8horNRBUSN5ffSv+v/u8uDWe7CmKnB9E0="
      },
      {
        "username": "2f0e8144029624228d60e5e453efc2ec0dbe71e185559eeed36abf152a06faf1",
        "urls": "turn:global.turn.twilio.com:3478?transport=tcp",
        "credential": "XdgWiiLovT8horNRBUSN5ffSv+v/u8uDWe7CmKnB9E0="
      },
      {
        "username": "2f0e8144029624228d60e5e453efc2ec0dbe71e185559eeed36abf152a06faf1",
        "urls": "turn:global.turn.twilio.com:443?transport=tcp",
        "credential": "XdgWiiLovT8horNRBUSN5ffSv+v/u8uDWe7CmKnB9E0="
      }],
    })
    on(ACTIONS.INIT, (id: string) => myId = id)
    on(ACTIONS.STATE_INIT, () => stateIsReady = true )
    on(ACTIONS.STATE_INIT, () => {
      const character = localStorage.getItem('character')
      character && send('character', JSON.parse(character))
    })
    on(ACTIONS.INIT, tryResolve)
    on(ACTIONS.STATE_INIT, tryResolve)
    on(ACTIONS.ERROR, reject)
  })
}

createGame()