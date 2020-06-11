import { Map } from '../../types/types'
import { randomFrom, randomBetween } from './utils'
import { XYZ, xyz, Polygon, imageToPolygon, add, circleCollidesWithPolygon, collisionCircle, position, entity, two } from 'tiny-game-engine'
import Jimp from 'jimp'

export function buildWalls(map: Map): Polygon[] {

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

  return pols.map(poly => poly.map(p => xyz(p.x, p.y)))
}

const polygonImages = new Map<string, {data: Uint8ClampedArray, width: number, height: number}>()
async function loadImage(url: string): Promise<{data: Uint8ClampedArray, width: number, height: number}> {
  //@ts-ignore
  const img = await Jimp.read({url, timeout: 3000})
  return {
    data: new Uint8ClampedArray(img.bitmap.data),
    width: img.getWidth(),
    height: img.getHeight()
  }
}
export async function preloadImages(clientUrl: string): Promise<void[]> {
  const promises = Object.entries({
    Z: '/img/decorations/auto1.png',
    X: '/img/decorations/auto2.png',
    O: '/img/decorations/puu2.png',
    G: '/img/decorations/puu1.png'
  }).map(async ([key, path]) => {
      const result = await loadImage(`${clientUrl}${path}`)
      polygonImages.set(key, result)
    })
  return await Promise.all(promises)
}

export function buildPolygons(map: Map): Polygon[] {
  return map.tiles.flatMap((chars, row) => {
    return chars.split('')
      .map((tile, col) => {
        const img = polygonImages.get(tile)
        if (img) {
          const offset = xyz(col * map.tileSize, row * map.tileSize)
          const {data, width, height} = img
          const points = imageToPolygon(data, width, height)
          return points.map(p => add(p, offset))
        } else return []
      })
      .filter(p => p.length > 0)
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
  return randomFrom(maps)
}

export function getSpawnPoint({tiles, tileSize}: Map, collisionPolygons: Polygon[], dim: XYZ): XYZ {
  while(true) {
    const rx = randomBetween(2, tiles[0].length-2),
          ry = randomBetween(2, tiles.length-2)
    const circle = collisionCircle(entity(position(xyz(rx * tileSize, ry * tileSize)), add(dim, two)))
    let isok = true
    for (let x of [-1, 0, 1]) for (let y of [-1, 0, 1]) {
      isok = isok && tiles[ry+y][rx+x] === ' '
    }
    isok = isok && !collisionPolygons.find(poly => circleCollidesWithPolygon(circle, poly))
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
    id: "map_12",
    name: "The Arena 2 (2-4 players)",
    floorAsset: 'grass',
    tileSize: 16,
    music: 'crickets',
    tiles: [
      ",-----------------------------------GgggGggg  ",
      "|                               GgggggggggGggg",
      "|                             GggggOoooooggggg",
      "|                             gggggoooooogGggg",
      "|                             gggggooooGgggg  ",
      "|                              ggggoGooggggg  ",
      "|       Oooooo                 ggggoooogggOooo",
      "|       oooooo                  Gggooooooggooo",
      "|       ooooGggg                gggg   ggggooo",
      "|       oooogggg                gggg       ooo",
      "|       oooogggg                           ooo",
      "|       oooooo                             ooo",
      "|                                            |",
      "|                                            |",
      "|                   Gggg                     |",
      "|                   gggg                     |",
      "|                   gggg                     |",
      "|                                            |",
      "|                                            |",
      "|                                            |",
      "|       Oooooo                               |",
      "|       oooOooooo                            |",
      "|       ooooooooo                            |",
      "|       ooooooooo                            |",
      "|       ooooooooo              GggGggg       |",
      "|       oGgggoooo            Ggggggggg       |",
      "|        ggggoooo            ggggggGggg      |",
      "|        gggg                gggg  gggg      |",
      "|                                  gggg      |",
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
      "|            Cc Cc   Cc Cc             |",
      "|            cc cc   cc cc             |",
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
  },
  {
    id: "map_7",
    name: "outdoors (2-8)",
    floorAsset: 'grass',
    tileSize: 16,
    music: 'crickets',
    tiles: [
      ",--------------------------------------.",
      "|                                      |",
      "|                                      |",
      "|                                      |",
      "|                                      |",
      "|                                      |",
      "|                    Oooooo            |",
      "|                    oooooo            |",
      "|      Oooooo        oooooo            |",
      "|      oooooo        oooooo            |",
      "|      oooooo        oooooo            |",
      "|      oooooo        oooooo            |",
      "|      oooooo                          |",
      "|      oooooo                          |",
      "|                          Oooooo      |",
      "|                          oooooo      |",
      "|                          oooooo      |",
      "|                          oooooo      |",
      "|           Oooooo         oooooo      |",
      "|           oooooo         oooooo      |",
      "|           oooooo           Xxxxxxxxxxx",
      "|           oooooo           xxxxxxxxxxx",
      "|           oooooo           xxxxxxxxxxx",
      "|           oooooo           xxxxxxxxxxx",
      "|                            xxxxxxxxxxx",
      "|                            Zzzzzzzzzzz",
      "|                            zzzzzzzzzzz",
      "|                            zzzzzzzzzzz",
      "|                            zzzzzzzzzzz",
      "|                            zzzzzzzzzzz",
      ";--------------------------------------:"
    ]
  }
];