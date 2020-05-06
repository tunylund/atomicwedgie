const iceServers = [
  // {
  //   "url": "stun:global.stun.twilio.com:3478?transport=udp",
  //   "urls": "stun:global.stun.twilio.com:3478?transport=udp"
  // },
  // {
  //   "url": "turn:global.turn.twilio.com:3478?transport=udp",
  //   "username": "c266100c5eee1a508d2fa0d668706789cdf64f34f800d4401fd695e2041e2628",
  //   "urls": "turn:global.turn.twilio.com:3478?transport=udp",
  //   "credential": "ldXXP3Q9oZKxdO36x6YUmoTO4eNe3LHM4gR00MGLcG0="
  // },
  // {
  //   "url": "turn:global.turn.twilio.com:3478?transport=tcp",
  //   "username": "c266100c5eee1a508d2fa0d668706789cdf64f34f800d4401fd695e2041e2628",
  //   "urls": "turn:global.turn.twilio.com:3478?transport=tcp",
  //   "credential": "ldXXP3Q9oZKxdO36x6YUmoTO4eNe3LHM4gR00MGLcG0="
  // },
  // {
  //   "url": "turn:global.turn.twilio.com:443?transport=tcp",
  //   "username": "c266100c5eee1a508d2fa0d668706789cdf64f34f800d4401fd695e2041e2628",
  //   "urls": "turn:global.turn.twilio.com:443?transport=tcp",
  //   "credential": "ldXXP3Q9oZKxdO36x6YUmoTO4eNe3LHM4gR00MGLcG0="
  // }
]

const channels = new Set()

export function init(polite, socket) {
  const peer = new RTCPeerConnection({ iceServers })
  
  let makingOffer
  peer.onnegotiationneeded = async () => {
    console.log('signal:', 'negotiationneeded')
    try {
      makingOffer = true;
      await peer.setLocalDescription()
      socket.emit('signal', JSON.stringify({ description: peer.localDescription }))
      console.log('signal:', `provided an ${peer.localDescription.type}`)
    } catch(err) {
      console.error(err);
    } finally {
      makingOffer = false;
    }
  }

  function close() {
    peer.onnegotiationneeded = null
    peer.onicecandidate = null
    peer.onconnectionstatechange = null
    peer.oniceconnectionstatechange = null
    peer.onsignalingstatechange = null
    peer.ondatachannel = null
    socket.off('signal', signal)
    peer.close()
    console.log('closed the peer')
  }

  peer.onicecandidate = ({candidate}) => socket.emit('signal', JSON.stringify({ candidate }))
  peer.oniceconnectionstatechange = () => {
    if (peer.iceConnectionState === 'disconnected') close()
    if (peer.iceConnectionState === 'closed') close()
    if (peer.iceConnectionState === 'failed') peer.restartIce()
  }
  peer.onconnectionstatechange = () => {
    if (peer.connectionState === 'closed') close()
  }
  peer.onsignalingstatechange = () => {
    if (peer.signalingState === 'closed') close()
  }

  let ignoreOffer = false
  async function signal(msg) {
    const { description, candidate } = JSON.parse(msg)
    try {
      if (description) {
        const offerCollision = (description.type == "offer") &&
                               (makingOffer || peer.signalingState != "stable")
  
        ignoreOffer = !polite && offerCollision
        if (ignoreOffer) {
          console.log('signal:', `ignoring a remote ${description.type}`)
          return
        }

        await peer.setRemoteDescription(description)
        console.log('signal:', `accepted a remote ${description.type}`)
        if (description.type == "offer") {
          await peer.setLocalDescription()
          socket.emit('signal', JSON.stringify({ description: peer.localDescription }))
          console.log('signal:', `provided an answer`)
        }
      } else if (candidate) {
        try {
          await peer.addIceCandidate(candidate);
        } catch(err) {
          if (!ignoreOffer && !err.message.includes('Unknown ufrag')) {
            console.error('iceice', err)
            throw err;
          }
        }
      }
    } catch(err) {
      console.error(err, peer);
    }
  }
  socket.on('signal', signal)
  peer.ondatachannel = ({channel}) => {
    console.log(`data-channel-${channel.id}-${channel.readyState}:`, 'received a remote data-channel')
    addChannel(channel)
  }
  return peer
}
window.channels = channels

function addChannel(channel) {
  // console.log(channel)
  // setTimeout(() => console.log(channel), 5000)
  // setTimeout(() => console.log(channel), 10000)
  // setTimeout(() => console.log(channel), 15000)

  channel.onopen = () => {
    console.log(`data-channel-${channel.id}-${channel.readyState}:`, 'open')
    for (let ch of channels) { ch.close() }
    channels.add(channel)
    startLagPingPong(channel)
  }
  channel.onclose = () => {
    console.log(`data-channel-${channel.id}-${channel.readyState}:`, 'close')
    channel.onerror = channel.onmessage = null
    channels.delete(channel)
    stopLagPingPong(channel)
  }
  channel.onerror = error => {
    if (error.error.message === 'Transport channel closed') return;
    console.error(`data-channel-${channel.id}-${channel.readyState}:`, error)
  }
  channel.onmessage = msg => {
    const {action, attrs} = JSON.parse(msg.data)
    if (action === 'ping') ping(channel, ...attrs)
    if (action === 'pong') pong(channel, ...attrs)
  }
}

export function connect(peer) {
  addChannel(peer.createDataChannel('some-channel'))
  console.log('signal:', 'created a local data-channel')
}

const pingPongTimeOuts = new Map()
function startLagPingPong(channel) {
  function pingForLag() {
    if(channel.readyState === 'open') {
      ping(channel, Date.now())
      pingPongTimeOuts.set(channel, setTimeout(pingForLag, 3000))
    }
  }
  pingForLag()
}
function stopLagPingPong(channel) {
  const pingPongTimeOut = pingPongTimeOuts.get(channel)
  clearTimeout(pingPongTimeOut)
  pingPongTimeOuts.delete(channel)
}

function ping(channel) {
  send(channel, 'ping', Date.now())
}

function pong(channel, lagToServer, peerTime) {
  console.log('lagToServer:', lagToServer, 'roundTime:', Date.now() - peerTime)
}

function send(channel, action, ...attrs) {
  channel.send(JSON.stringify({action, attrs}))
}

function emit(action, ...attrs) {
  console.log(channels)
  channels.forEach(channel => send(channel, action, ...attrs))
}

// open unique peer per browser load
// close peer and allow it to die when remote reloads
// both create data channel but the last one created overrides the previous one

export function connectAsNonHost(socket) {
  const peer = new RTCPeerConnection({ iceServers })
  
  peer.onnegotiationneeded = async () => {
    console.log('signal:', 'negotiationneeded')
  }

  function close() {
    peer.onnegotiationneeded = null
    peer.onicecandidate = null
    peer.onconnectionstatechange = null
    peer.oniceconnectionstatechange = null
    peer.onsignalingstatechange = null
    peer.ondatachannel = null
    socket.off('signal', signal)
    peer.close()
    console.log('closed the peer')
  }

  peer.onicecandidate = ({candidate}) => socket.emit('signal', JSON.stringify({ candidate }))
  peer.oniceconnectionstatechange = () => {
    if (peer.iceConnectionState === 'closed') close()
    if (peer.iceConnectionState === 'failed') peer.restartIce()
  }
  peer.onconnectionstatechange = () => {
    if (peer.connectionState === 'closed') close()
  }
  peer.onsignalingstatechange = () => {
    if (peer.signalingState === 'closed') close()
  }

  async function signal(msg) {
    const { description, candidate } = JSON.parse(msg)
    try {
      if (description) {
        if (description.type === 'offer') {
          await peer.setRemoteDescription(description)
          const answer = await peer.createAnswer()
          peer.setLocalDescription(answer)
          socket.emit('signal', JSON.stringify({ description: answer }))
          console.log('signal:', `provided an answer`)
        }
      } else if (candidate) {
        await peer.addIceCandidate(candidate);
      }
    } catch(err) {
      console.error(err, peer);
    }
  }
  socket.on('signal', signal)
  addChannel(peer.createDataChannel('some-channel', {negotiated: true, id: 0}))
  return {peer, close}
}