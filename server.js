const http = require('http'),
      urlParser = require('url'),
      game = require('./server/game.js').game,
      socketIO = require('socket.io'),
      static = require('node-static'),
      port = process.env.PORT || 1337;

const staticServer = new static.Server('./client/', {
  cache: 'no-cache'
});

const httpServer = http.createServer((req, res) => {

  const url = urlParser.parse(req.url),
        parts = url.pathname.split("/"),
        part = parts.find(x => x !== '') || 'index.html';

  switch(part) {
  
    case "status":
      res.setHeader('Cache-Control', 'no-cache');
      res.writeHead(200, {
        'Content-type': 'application/json'
      });
      res.end(JSON.stringify(game.status()));
      break;

    case "favicon.ico":
    case "js":
    case "lib":
    case "css":
    case "img":
    case "sounds":
    case "game.html":
    case "index.html":
      req.addListener('end', function () {
        staticServer.serve(req, res);
      }).resume();
      break;
      
    default:
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('Path not found.\n');
      console.error("path not found: " + req.url);
      break;
  
  }

});
httpServer.listen(port);

const io = socketIO(httpServer)
io.sockets.on('connection', game.connect.bind(game));

console.log('Server running at http://127.0.0.1:' + port + '/');
