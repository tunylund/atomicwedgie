import http from 'http'
import urlParser from 'url'
import { start } from 'shared-state-server'
import { initialState, addClient, status } from './game'
import { readFileSync } from 'fs'

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
      res.end('404')
      break

  }
})

const iceServers = JSON.parse(readFileSync('.env', 'utf8'))
console.log(`using iceServers: ${iceServers}`)

start(httpServer, initialState, addClient, { iceServers })

httpServer.listen(port)
console.log(`Server running at http://127.0.0.1:${port}/`)
