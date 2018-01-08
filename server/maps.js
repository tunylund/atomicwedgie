const u = require('./utils.js'),
      res = require('./../client/js/resources').resources,
      pills = require('./pills.js')

function sliceString(str, length) {
  let result = []
  for (let cursor = 0; cursor < str.length; cursor += length) {
      result.push(str.substr(cursor, length))
  }
  return result
}
/**
 * Takes an ascii-art-style array of characters and converts it to an Akihabara-compatible map format.
 * @param {Array} asciiMap An array of characters representing a map.
 * @param {Array} translationMap A translation array. This is an array of arrays, formatted like [ [null, char1], [0, char2], [1, char3] ]. There must at least be a null entry, followed by one numerical entry for each tile type you want to render, corresponding to the unique characters in the map array. The null entry maps a character to empty space.
 * @returns A map array formatted such that it can be attached to a map object.
 */
function asciiArtToMap(asciiMap, translationMap) {
  const characterLength = Object.keys(translationMap)[0].length;
  return asciiMap
    .map(asciiRow => sliceString(asciiRow, characterLength)
      .map(slice => translationMap[slice]))
}

const pillInterval = 1000

class Map {

  constructor(map, players) {
    this.players = players
    this.map = map
    this.map.tileData = asciiArtToMap(this.map.tiles, this.map.characterMap)
    this.map.height = Math.ceil(this.map.tiles.length * this.map.tileSize)
    this.map.width = Math.ceil(this.map.tiles[0].length * this.map.tileSize)
    this.maxPills = Math.ceil(this.map.tiles[0].length * this.map.tiles[0][0].length / (16), 3)
    this.pills = []
    this.pillInterval = setInterval(() => this.checkPills(), pillInterval)
  }

  remove () {
    clearInterval(this.pillInterval)
    while(this.pills.length > 0) {
      const pill = this.pills.pop()
      pill.clearEffect()
    }
    this.pills = []
  }

  toJson () {
    return {
      map: this.map,
      pills: this.pills
    }
  }

  getSpawnPoint () {
    while(true) {
      const rx = u.randomBetween(2, this.map.tileData[0].length-2),
            ry = u.randomBetween(2, this.map.tileData.length-2)
      let isok = true
      for (let x of [-1, 0, 1]) for (let y of [-1, 0, 1]) {
        isok = isok && this.map.tiles[ry+y][rx+x] === ' '
      }
      if (isok) return {
        x: rx * this.map.tileSize,
        y: ry * this.map.tileSize
      }
    }
  }

  popPill (id) {
    const ix = this.pills.findIndex(p => p.id === id)
    return this.pills.splice(ix, 1)[0]
  }

  checkPills () {
    if(this.pills.length < this.maxPills && Math.random() < 0.25) {
      this.createPill()
    }
  }

  createPill () {
    const point = this.getSpawnPoint(),
          pill = pills.getRandomPill(point)
    this.pills.push(pill)
    this.sendNewPill(pill)
  }

  sendNewPill (pill) {
    for(let player of this.players) {
      player.client.json.emit("newPill", pill);
    }
  }

}

exports.random = function (players) {
  return new Map(u.randomFrom(maps), players)
}

const blueWalls = { ' ': 14,
                    ',': 0,
                    '.': 1,
                    '-': 2,
                    '|': 3,
                    ';': 5,
                    ':': 6,
                    'o': 14 }

      redWalls = { ' ': 14,
                   ',': 8,
                   '.': 9,
                   '-': 13,
                   '|': 10,
                   ';': 11,
                   ':': 12,
                   'o': 14 }

      decorations = { 'b': 14,
                      'B': 14,
                      'c': 14,
                      'C': 14,
                      'K': 14,
                      'k': 14,
                      'Q': 14,
                      'q': 14,
                      'T': 14,
                      't': 14,
                      'P': 14,
                      'p': 14,
                      'L': 14,
                      'l': 14,
                      'W': 14,
                      'w': 14,
                      'S': 14,
                      's': 14,
                      'H': 14,
                      'h': 14,
                      'Z': 14,
                      'z': 14,
                      'X': 14,
                      'x': 14,
                      'O': 14,
                      'o': 14 }

const maps = [
  {
    id: "map_1",
    name: "The Arena (2-4 players)",
    floorImage: res.largeMarble, //"img/floors/largemarble-huge.png",
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
    characterMap: Object.assign({}, redWalls, decorations),
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
    characterMap: Object.assign({}, blueWalls, decorations),
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
    characterMap: Object.assign({}, redWalls, decorations),
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
    characterMap: Object.assign({}, blueWalls, decorations),
    tiles: [
      ",--------------------------------------------------------------.",
      "|                                                              |",
      "|                                                              |",
      "|                                                              |",
      "|                                                              |",
      "|    -------------------------------------     |               |",
      "|                                              |               |",
      "|                                              |       Hhhhhh  |",
      "|                                            Kk|       hhhhhh  |",
      "|    |                                       kk|   ------------|",
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
      "|    |     |                       |         Kk|               |",
      "|    |     |                       |         kk|               |",
      "|          |         Ppppp         |         Kk|               |",
      "|          |         ppppp Kk      |         kk|               |",
      "|          |         ppppp kk      |         Kk|  Hhhhhh       |",
      "|          |         ppppp         |         kk|  hhhhhh       |",
      "|          |         Cc Cc                   Kk|----------     |",
      "|          |         cc cc                   kk|               |",
      "|          |                                 Kk|               |",
      "|          |                                 kk|               |",
      "|     |    |                       |         Kk|               |",
      "|     |    |                       |         kk|               |",
      "|     |    |  Hhhhhh       Hhhhhh  |         Kk|               |",
      "|     |    |  hhhhhh       hhhhhh  |         kk|               |",
      "|     |    ,-----------------------:           |               |",
      "|     |                                        |     Tttttttt  |",
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
    characterMap: Object.assign({}, redWalls, decorations),
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