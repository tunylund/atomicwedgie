require([
  "/socket.io/socket.io.js",
  "game"], function(s, game) {

  //This function is called when scripts/helper/util.js is loaded.
  //If util.js calls define(), then this function is not fired until
  //util's dependencies have loaded, and the util argument will hold
  //the module value for "helper/util".

  enchant.ui.assets = []//['pad.png', 'apad.png', 'icon0.png', 'font0.png'] };

  enchant();

  game.create()

});