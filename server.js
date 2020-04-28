const http = require('http'),
      urlParser = require('url'),
      game = require('./server/game.js').game,
      socketIO = require('socket.io'),
      static = require('node-static'),
      port = process.env.PORT || 8888

const staticServer = new static.Server('./client/', { cache: 60 * 5 }) // 5 min cache

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
      res.end(JSON.stringify(game.status()))
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

const io = socketIO(httpServer, { transports: ['websocket'] })
io.on('connection', game.connect.bind(game))

httpServer.listen(port)
console.log(`Server running at http://127.0.0.1:${port}/`)
