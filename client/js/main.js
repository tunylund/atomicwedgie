require([
  "/socket.io/socket.io.js",
  "game"], function(s, game) {

  enchant.ui.assets = []//['pad.png', 'apad.png', 'icon0.png', 'font0.png'] };

  enchant();

  game.create()

});