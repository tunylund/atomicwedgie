var http = require('http'),
    urlParser = require('url'),
    headers = require('./server/headers.js').headers,
    game = require('./server/game.js').game,
    socketIO = require('socket.io'),
    u = require('./server/utils.js'),
    static = require('node-static'),
    port = process.env.PORT || 1337;

var staticServer = new static.Server('./client/', {
  cache: 'no-cache'
});
    
var httpServer = http.createServer(function (req, res) {

  var url = urlParser.parse(req.url),
      parts = url.pathname.split("/"),
      part = u.firstNot(parts, '') || 'index.html';

  switch(part) {
  
    case "status":
      res.setHeader('Cache-Control', 'no-cache');
      res.writeHead(headers.success, headers.json);
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

var io = socketIO.listen(httpServer);
io.sockets.on('connection', u.proxy(game.connect, game));
io.configure(function (){
  //https://github.com/LearnBoost/Socket.IO/wiki/Configuring-Socket.IO
  io.set('transports', ['websocket', 'flashsocket']);
  io.set('log level', 1);//error only
  io.set('authorization', function (handshakeData, callback) {
    callback(null, true); // error first callback style 
  });
});

console.log('Server running at http://127.0.0.1:' + port + '/');
