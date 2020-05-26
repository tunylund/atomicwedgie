import { Map, AssetKey } from '../../types/types'
import { randomFrom, randomBetween } from './utils'
import { XYZ, xyz, Entity, entity, position } from 'tiny-game-engine'

export function buildWalls(map: Map): Entity[] {

  let pols = [],
      w = map.tiles[0].length * map.tileSize,
      h = map.tiles.length * map.tileSize,
      tw = map.tileSize,
      th = map.tileSize,
      poly = null

  //horPass
  for(let y=0; y<h; y=y+th) {
    for(let x=0; x<w; x=x+tw) {
      let hit = isSolid(map, x, y)
      if(hit) {
        if(poly) {
          poly[1].x = poly[2].x = x + tw
        } else {
          poly = [
            {x: x, y: y},
            {x: x + tw, y: y},
            {x: x + tw, y: y + th},
            {x: x, y: y + th}
          ]
        }
      } else {
        //don't care for 16width polys
        //don't care for outer walls
        if(poly && poly[1].x - poly[0].x > tw) {
          pols.push(poly)
        }
        poly = null
      }
    }
    if(poly && poly[1].x - poly[0].x > tw) {
      pols.push(poly)
    }
    poly = null
  }

  //verPass
  for(let x=0; x<w; x=x+tw) {
    for(let y=0; y<h; y=y+th) {
      let hit = isSolid(map, x, y)
      if(hit) {
        if(poly) {
          poly[2].y = poly[3].y = y + th
        } else {
          poly = [
            {x: x, y: y},
            {x: x + tw, y: y},
            {x: x + tw, y: y + th},
            {x: x, y: y + th}
          ]
        }
      } else {
        //don't care for 16height polys
        if(poly && poly[2].y - poly[1].y > th) {
          pols.push(poly)
        }
        poly = null
      }
    }
    if(poly && poly[2].y - poly[1].y > th) {
      pols.push(poly)
    }
    poly = null
  }

  return pols.map(poly => {
    const dim = xyz(poly[2].x - poly[0].x, poly[2].y - poly[0].y, 100)
    const cor = xyz(poly[0].x + dim.x2, poly[0].y + dim.y2)
    return entity(position(cor), dim)
  })
}

export function isSolid(map: Map, x: number, y: number) {
  const tileX = x / map.tileSize
  const tileY = y / map.tileSize
  const tile = map.tiles[tileY][tileX]
  const walls = [',', '.', '-', '|', ';', ':']
  const decorations = ['B', 'C', 'K', 'Q', 'W', 'S', 'H', 'T', 'L', 'P', 'Z', 'X', 'O']
  const decorations_ = decorations.map(d => d.toLowerCase())
  return walls.includes(tile) ||
    decorations.includes(tile) || 
    decorations_.includes(tile)
}

export function randomMap(): Map {
  return maps[2]// randomFrom(maps)
}

export function getSpawnPoint({tiles, tileSize}: Map): XYZ {
  const w = tiles[0].length-2,
        h = tiles.length-2
  while(true) {
    const rx = randomBetween(2, w),
          ry = randomBetween(2, h)
    let isok = true
    for (let x of [-1, 0, 1]) for (let y of [-1, 0, 1]) {
      isok = isok && tiles[ry+y][rx+x] === ' '
    }
    if (isok) return xyz(rx * tileSize, ry * tileSize)
  }
}

const maps: Map[] = [
  {
    id: "map_1",
    name: "The Arena (2-4 players)",
    floorAsset: 'largeMarble',
    tileSize: 16,
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
    floorAsset: 'largeMarble',
    tileSize: 16,
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
    floorAsset: 'largeMarble',
    tileSize: 16,
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
  //   floorAsset: res.largeConcrete,
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
    floorAsset: 'largeMarble',
    tileSize: 16,
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
    floorAsset: 'largeMarble',
    tileSize: 16,
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
    floorAsset: 'largeTile',
    tileSize: 16,
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