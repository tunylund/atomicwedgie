const http = require('http'),
      urlParser = require('url'),
      {connectToGame, status} = require('./server/game.js'),
      {start} = require('gamestate'),
      nodeStatic = require('node-static')

const port = process.env.PORT || 8888
const staticServer = new nodeStatic.Server('./client/', { cache: 0 }) // no cache

const httpServer = http.createServer((req, res) => {

  const url = urlParser.parse(req.url),
        parts = url.pathname.split("/"),
        part = parts.find(x => x !== '') || 'index.html'

  switch(part) {
  
    case "status":
      res.setHeader('Cache-Control', 'no-cache')
      res.writeHead(200, {
        'Content-type': 'application/json'
      })
      res.end(JSON.stringify(status()))
      break

    default:
      req.addListener('end', function () {
        staticServer.serve(req, res, err => {
          if (err && (err.status === 404)) {
            res.writeHead(404, {'Content-Type': 'text/plain'})
            res.end('Path not found.\n')
          }
        })
      }).resume()
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

start(httpServer, {}, connectToGame)

httpServer.listen(port)
console.log(`Server running at http://127.0.0.1:${port}/`)
