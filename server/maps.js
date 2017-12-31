var u = require('./utils.js'),
    res = require('./../client/js/resources').resources,
    pills = require('./pills.js')

/**
 * Takes an ascii-art-style array of characters and converts it to an Akihabara-compatible map format.
 * @param {Array} map An array of characters representing a map.
 * @param {Array} tra A translation array. This is an array of arrays, formatted like [ [null, char1], [0, char2], [1, char3] ]. There must at least be a null entry, followed by one numerical entry for each tile type you want to render, corresponding to the unique characters in the map array. The null entry maps a character to empty space.
 * @returns A map array formatted such that it can be attached to a map object.
 */
function asciiArtToMap(map,tra) {
  var sz=tra[0][1].length;
  var ret=[];
  var xpos;
  var pie;
  for (var y=0;y<map.length;y++) {
    var row=[];
    xpos=0;
    while (xpos<map[y].length) {
      pie=map[y].substr(xpos,sz);
      for (var t=0;t<tra.length;t++)
        if (pie==tra[t][1]) {
          //if (t==0) row.push(null); else 
          row.push(tra[t][0]);
          break;
        }
      xpos+=sz;
    }
    ret.push(row);
  }
  return ret;
}

var pillInterval = 1000

exports.Map = function(map, game) {
  this.game = game
  this.map = map;
  this.init();
};
exports.Map.prototype = {

  init: function() {
    this.map.tileData = asciiArtToMap(this.map.tiles, this.map.characterMap)
    this.map.height = Math.ceil(this.map.tiles.length * this.map.tileSize)
    this.map.width = Math.ceil(this.map.tiles[0].length * this.map.tileSize)
    this.maxPills = Math.ceil(this.map.tiles[0].length * this.map.tiles[0][0].length / (16))
    this.maxPills = this.maxPills < 3 ? 3 : this.maxPills
    this.pills = new u.HashList()
    this.pillInterval = setInterval(u.proxy(this.checkPills, this), pillInterval)
  },

  remove: function() {
    clearInterval(this.pillInterval)
    while(this.pills.length > 0) {
      var pill = this.pills.arr[0]
      if(pill.timeout)
        clearTimeout(this.pillEffects[pill.type].timeout)
      this.pills.remove(pill)
    }
    this.pills = new u.HashList()
  },
  
  toJson: function() {
    return {
      map: this.map,
      pills: this.pills.arr
    }
  },

  getSpawnPoint: function() {
    while(true) {
      var rx = u.randomBetween(2, this.map.tileData[0].length-2),
          ry = u.randomBetween(2, this.map.tileData.length-2)
      if(this.map.tiles[ry-1][rx-1]   == ' '
        && this.map.tiles[ry-1][rx]   == ' '
        && this.map.tiles[ry-1][rx+1] == ' '
        && this.map.tiles[ry][rx-1]   == ' '
        && this.map.tiles[ry][rx]     == ' '
        && this.map.tiles[ry][rx+1]   == ' '
        && this.map.tiles[ry+1][rx-1] == ' '
        && this.map.tiles[ry+1][rx]   == ' '
        && this.map.tiles[ry+1][rx+1] == ' ') {
        return {
          x: rx * this.map.tileSize,
          y: ry * this.map.tileSize
        }
      }
    }
  },

  consumePill: function(id, player) {
    var pill = this.pills.hash[id]
    if(pill) {
      this.pills.remove(pill)
      player.consumePill(pill)
      this.sendDelPill(id)
    }
  },

  checkPills: function() {
    if(this.pills.length < this.maxPills && Math.random() < 0.25) {
      this.createPill()
    }
  },

  createPill: function() {
    var point = this.getSpawnPoint(),
        pill = pills.pill(u.randomFrom(pills.pillTypes), point)
    this.pills.push(pill)
    this.sendNewPill(pill)
  },

  sendNewPill: function(pill) {
    for(var i=0; i<this.game.players.length; i++) {
      this.game.players.arr[i].client.json.emit("newPill", pill);
    }
  },

  sendDelPill: function(pillId) {
    for(var i=0; i<this.game.players.length; i++) {
      this.game.players.arr[i].client.emit("delPill", pillId);
    }
  }
  
}

var blueWalls = [[14, ' '], 
                [0, ','], 
                [1, '.'], 
                [2, '-'], 
                [3, '|'], 
                [5, ';'],
                [6, ':'],
                [14, 'o']]

    redWalls = [[14, ' '], 
                [8, ','], 
                [9, '.'], 
                [13, '-'], 
                [10, '|'], 
                [11, ';'],
                [12, ':'],
                [14, 'o']]

    decorations = [[14, 'b'],
                  [14, 'B'],
                  [14, 'c'],
                  [14, 'C'],
                  [14, 'K'],
                  [14, 'k'],
                  [14, 'Q'],
                  [14, 'q'],
                  [14, 'T'],
                  [14, 't'],
                  [14, 'P'],
                  [14, 'p'],
                  [14, 'L'],
                  [14, 'l'],
                  [14, 'W'],
                  [14, 'w'],
                  [14, 'S'],
                  [14, 's'],
                  [14, 'H'],
                  [14, 'h'],
                  [14, 'Z'],
                  [14, 'z'],
                  [14, 'X'],
                  [14, 'x'],
                  [14, 'O'],
                  [14, 'o']]

exports.maps = [
  {
    id: "map_1",
    name: "The Arena (2-4 players)",
    floorImage: res.largeMarble,//"img/floors/largemarble-huge.png",
    tileImage: res.walls,
    tileSize: 16,
    emptyTile: 14,
    characterMap: blueWalls,
    tiles: [
      ",--------------------------------------------.",
      "|                                            |",
      "|                                            |",
      "|                                            |",
      "|                                            |",
      "|                                            |",
      "|       ,-----                    ----.      |",
      "|       |                             |      |",
      "|       |                             |      |",
      "|       |                             |      |",
      "|       |                             |      |",
      "|               ---------------              |",
      "|                                            |",
      "|                                            |",
      "|                                            |",
      "|                                            |",
      "|                                            |",
      "|                                            |",
      "|                                            |",
      "|               ---------------              |",
      "|       |                             |      |",
      "|       |                             |      |",
      "|       |                             |      |",
      "|       |                             |      |",
      "|       ;-----                   -----:      |",
      "|                                            |",
      "|                                            |",
      "|                                            |",
      "|                                            |",
      "|                                            |",
      ";--------------------------------------------:"
    ]
  },
  {
    id: "map_2",
    name: "Inside the Asylum (2-4 players)",
    floorImage: res.largeMarble,
    tileImage: res.walls,
    tileSize: 16,
    emptyTile: 14,
    characterMap: redWalls.concat(decorations),
    tiles: [
      ",--------------------------------------.",
      "|                                      |",
      "|                                      |",
      "|                                      |",
      "|      |       |                 |     |",
      "|      |       |                 |     |",
      "|      |       |                 |     |",
      "|      |       |         |       |     |",
      "|              |         |       |     |",
      "|                        |       |     |",
      "|                       ,:       |     |",
      "|                       |        |     |",
      "|      |                |        |     |",
      "|      |    Bbbbbbbb             |     |",
      "|      |    bbbbbbbb             |     |",
      "|      |    bbbbbbbb             |     |",
      "|      |    bbbbbbbb             |     |",
      "|      |    bbbbbbbb             |     |",
      "|      |                         |     |",
      "|                                      |",
      "|                                      |",
      "|           -----------------          |",
      "|                                      |",
      "|      |                         |     |",
      "|      |                         |     |",
      "|      |                         |     |",
      "|      |                         |     |",
      "|                                      |",
      "|          Cc   Cc   Cc   Cc           |",
      "|          cc   cc   cc   cc           |",
      ";--------------------------------------:"
    ]
  },
  {
    id: "map_3",
    name: "Apartment (2-4 players)",
    floorImage: res.largeMarble,
    tileImage: res.walls,
    tileSize: 16,
    emptyTile: 14,
    characterMap: blueWalls.concat(decorations),
    tiles: [
      ",---------------------------------------------------.",
      "|              |              |      |            Kk|",
      "|              |              |                   kk|",
      "|                             |                     |",
      "|                             |                     |",
      "|                                    |            Kk|",
      "|              |                     |            kk|",
      "|              |                     |            Kk|",
      "|--    --------|                     |            kk|",
      "|              |              |      |              |",
      "|              |              |      |              |",
      "|              ;--------------:      |              |",
      "|                                    ;------    ----|",
      "|                                                   |",
      "|                                                   |",
      "|                                                   |",
      "|     Tttttttt                                      |",
      "|     tttttttt                                      |",
      "|     tttttttt                                      |",
      "|                                                   |",
      "|                                                   |",
      "|                                                   |",
      "|                |    -------------.                |",
      "|                |                 |                |",
      "|                |                 |                |",
      "|   -------------:                 |                |",
      "|                                  |                |",
      "|                                  |                |",
      "|                                  |                |",
      "|          |      Bbbbbbbb         |                |",
      "|          |      bbbbbbbb    -----|                |",
      "|          |      bbbbbbbb         |                |",
      "|          |      bbbbbbbb         |                |",
      "|          |      bbbbbbbb         |                |",
      "|          |                       |                |",
      "|          |                       |                |",
      "|     Ww   |                       |                |",
      "|  Ss ww   |    Hhhhhh   Hhhhhh    |                |",
      "|  ss ww   |    hhhhhh   hhhhhh    |                |",
       ";---------------------------------------------------:"
    ]
  },
  // {
  //   id: "map_4",
  //   name: "The Happy Toilet (2-4 players)",
  //   floorImage: res.largeConcrete,
  //   tileImage: res.walls,
  //   tileSize: 16,
  //   emptyTile: 14,
  //   characterMap: blueWalls.concat(decorations),
  //   tiles: [
  //     ",---------------------------------------------------.",
  //     "|            |                                      |",
  //     "|            |                                      |",
  //     "|            |                                      |",
  //     "|            |                                      |",
  //     "|            |                                      |",
  //     "|            |     ,---                             |",
  //     "|                  |                                |",
  //     "|                  |                                |",
  //     "|  Ww  |           |                                |",
  //     "|  ww  |           |                                |",
  //     "|  ww  |           |                                |",
  //     "|      |           |                                |",
  //     "|------------------:                                |",
  //     "|                                                   |",
  //     "|                                                   |",
  //     "|                                                   |",
  //     "|                                                   |",
  //     "|      |                                            |",
  //     "|      |                                            |",
  //      ";---------------------------------------------------:"
  //   ]
  // },
  {
    id: "map_5",
    name: "The Pool Hall (2-4 players)",
    floorImage: res.largeMarble,
    tileImage: res.walls,
    tileSize: 16,
    emptyTile: 14,
    characterMap: redWalls.concat(decorations),
    tiles: [
      ",--------------------------------------------------------------.",
      "|     |     |               |     |                            |",
      "|     |     |               |     |                            |",
      "|     |     |               |     |                            |",
      "|     |     |    Ppppp   Kk |     |                            |",
      "|     |          ppppp   kk |         Bbbbbbbb    Bbbbbbbb     |",
      "|     |          ppppp      |         bbbbbbbb    bbbbbbbb     |",
      "|     |          ppppp      |         bbbbbbbb    bbbbbbbb     |",
      "|     |                  Kk |         bbbbbbbb    bbbbbbbb     |",
      "|           |            kk |     |   bbbbbbbb    bbbbbbbb     |",
      "|           |               |     |                            |",
      "|           |    Ppppp      |     |                            |",
      "|           |    ppppp   Kk |     |                            |",
      "|     |     |    ppppp   kk |     |   Bbbbbbbb    Bbbbbbbb     |",
      "|     |     |    ppppp      |     |   bbbbbbbb    bbbbbbbb     |",
      "|     |     |               |     |   bbbbbbbb    bbbbbbbb     |",
      "|     |     |            Kk |     |   bbbbbbbb    bbbbbbbb     |",
      "|     |     |            kk |     |   bbbbbbbb    bbbbbbbb     |",
      "|     |     |               |     |                            |",
      "|     |     |                     |                            |",
      "|     |     |                     |                            |",
      "|     |     |                     |    Cc          Cc    Cc    |",
      "|     |     |                     |    cc          cc    cc    |",
      "|     |                           |                            |",
      "|     |                     |     ;-----------    -------------|",
      "|     |                     |                                  |",
      "|     ;-------.             |                                  |",
      "|             |             |                                  |",
      "|             |             |                                  |",
      "|             |   Hhhhhh    |                                  |",
      "|             |   hhhhhh    |                                  |",
      "|             ;-------------:                                  |",
      "|    -----.                                                    |",
      "|         |                                                    |",
      "|         |                                                    |",
      "|         |                                                    |",
      "|   Lll   |                                                    |",
      "|   lll   |                                                    |",
      "|   lll   |                                                    |",
      "|   lll   |        ,--------------    ---------------------    |",
      "|   lll   |        |   Ss  Ss  Ss                              |",
      "|   lll   |   |        ss  ss  ss                              |",
      "|   lll   |   |                                                |",
      "|   lll       |                                                |",
      "|             |                         Ww   Ww   Ww   Ww      |",
      "|             |    |                  | ww | ww | ww | ww |    |",
      "|             |    |                  | ww | ww | ww | ww |    |",
      ";--------------------------------------------------------------:"
    ]
  },
  {
    id: "map_6",
    name: "The Lounge (2-4 players)",
    floorImage: res.largeMarble,
    tileImage: res.walls,
    tileSize: 16,
    emptyTile: 14,
    characterMap: blueWalls.concat(decorations),
    tiles: [
      ",--------------------------------------------------------------.",
      "|                                                              |",
      "|                                                              |",
      "|                                                              |",
      "|                                                              |",
      "|    -------------------------------------     |               |",
      "|                                              |               |",
      "|                                              |       Hhhhhh  |",
      "|                                              |       hhhhhh  |",
      "|    |                                         |   ------------|",
      "|    |                                         |               |",
      "|    |                                         |               |",
      "|    |              |     |                  Kk|               |",
      "|    |              |     |                  kk|               |",
      "|                   |     |                    |               |",
      "|                   |     |                    |               |",
      "|                   |     |                    |               |",
      "|                   |     |                                    |",
      "|                   |     |                                    |",
      "|                   |     |                                    |",
      "|    |              |     |                                    |",
      "|    |     ,--------:     ;--------.           |               |",
      "|    |     |                       |           |               |",
      "|    |     |                       |           |               |",
      "|    |     |                       |           |               |",
      "|    |     |                       |           |               |",
      "|          |         Ppppp         |         Kk|               |",
      "|          |         ppppp Kk      |         kk|               |",
      "|          |         ppppp kk      |           |  Hhhhhh       |",
      "|          |         ppppp         |           |  hhhhhh       |",
      "|          |         Cc Cc                     |----------     |",
      "|          |         cc cc                     |               |",
      "|          |                                 Kk|               |",
      "|          |                                 kk|               |",
      "|     |    |                       |           |               |",
      "|     |    |                       |           |               |",
      "|     |    |  Hhhhhh       Hhhhhh  |           |               |",
      "|     |    |  hhhhhh       hhhhhh  |           |               |",
      "|     |    ,-----------------------:         Kk|               |",
      "|     |                                      kk|     Tttttttt  |",
      "|     |                                        |     tttttttt  |",
      "|     |                                              tttttttt  |",
      "|     |                                                        |",
      "|          ---------    ------------                           |",
      "|                                                              |",
      "|                                              |               |",
      "|                                              |               |",
      ";--------------------------------------------------------------:"
    ]
  },
  {
    id: "map_7",
    name: "",
    floorImage: res.largeTile,
    tileImage: res.walls,
    tileSize: 16,
    emptyTile: 14,
    characterMap: redWalls.concat(decorations),
    tiles: [
      ",--------------------------------------.",
      "|                                      |",
      "|                                      |",
      "|                                      |",
      "|                     ,.        ,.     |",
      "|                     |Qq      Kk|     |",
      "|     ,-------        |qq      kk|     |",
      "|     |               |Qq      Kk|     |",
      "|     |               |qq      kk|     |",
      "|     |               ;:        ;:     |",
      "|     |                                |",
      "|     |                                |",
      "|     |                                |",
      "|     |      |          HhHhhhhh       |",
      "|     |      |        ,.hhhhhhhh,.     |",
      "|     |      |        ;----------:     |",
      "|     |      |                         |",
      "|     |      |                         |",
      "|     |                                |",
      "|     |                                |",
      "|     |                                |",
      "|     |               |          |     |",
      "|     |               |    Ww Ww |     |",
      "|     |               | Ss ww ww |     |",
      "|     |               | ss ww ww |     |",
      "|     ;-------        ;----------:     |",
      "|                                      |",
      "|                                      |",
      "|                                      |",
      "|                                      |",
      ";--------------------------------------:"
    ]
  }
];
