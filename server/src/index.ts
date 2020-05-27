import http from 'http'
import urlParser from 'url'
import { start } from 'shared-state-server'
import { initialState, addClient, status } from './game'

const port = process.env.PORT || 8888

const httpServer = http.createServer((req, res) => {
  const url = urlParser.parse(req.url || ''),
      parts = url.pathname?.split("/") || [],
      part = parts.find(x => x !== '') || 'index.html'

  switch(part) {

    case "status":
      res.setHeader('Cache-Control', 'no-cache')
      res.writeHead(200, { 'Content-type': 'application/json' })
      res.end(JSON.stringify(status()))
      break

    default:
      res.writeHead(404)
      res.end()
      break

  }
})

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

start(httpServer, initialState, addClient)

httpServer.listen(port)
console.log(`Server running at http://127.0.0.1:${port}/`)
