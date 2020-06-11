import http from 'http'
import urlParser from 'url'
import { start } from 'shared-state-server'
import { initialState, addClient, status } from './game'
import { preloadImages } from './maps'

const port = process.env.PORT || 8888

const httpServer = http.createServer((req, res) => {
  const url = urlParser.parse(req.url || ''),
      parts = url.pathname?.split("/") || [],
      part = parts.find(x => x !== '') || 'index.html'

  switch(part) {

    case "ice-servers":
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', ['GET', 'OPTIONS'])
      res.setHeader('Cache-Control', 'no-cache')
      res.writeHead(200, { 'Content-type': 'application/json' })
      res.end(JSON.stringify(iceServers))
      break

    case "status":
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', ['GET', 'OPTIONS'])
      res.setHeader('Cache-Control', 'no-cache')
      res.writeHead(200, { 'Content-type': 'application/json' })
      res.end(JSON.stringify(status()))
      break

    default:
      res.writeHead(404)
      res.end('404')
      break

  }
})

const clientUrl = process.env.CLIENT_URL || 'http://localhost:8080'
const iceServers = JSON.parse(process.env.ICE_SERVERS || '[]')
console.log(`using iceServers: ${JSON.stringify(iceServers)}`)

preloadImages(clientUrl).then(() => {
  start(httpServer, initialState, addClient, { iceServers })
  httpServer.listen(port)
  console.log(`Server running at http://127.0.0.1:${port}/`)
}).catch(err => {
  console.error(err)
})
