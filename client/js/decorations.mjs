import resources from './resources.mjs'

const types = {
  B: {
    width: 128,
    height: 77,
    image: resources.biliardTable
  },
  C: {
    width: 32,
    height: 29,
    image: resources.chair
  },
  K: {
    width: 30,
    height: 32,
    image: resources.chair2
  },
  Q: {
    width: 30,
    height: 32,
    image: resources.chair2,
    rotation: 180
  },
  W: {
    width: 32,
    height: 48,
    image: resources.toilet
  },
  S: {
    width: 32,
    height: 32,
    image: resources.sink
  },
  H: {
    width: 96,
    height: 34,
    image: resources.cauch
  },
  T: {
    width: 128,
    height: 48,
    image: resources.table
  },
  L: {
    width: 48,
    height: 128,
    image: resources.table2
  },
  P: {
    width: 77,
    height: 58,
    image: resources.table3
  },
  Z: {
    width: 175,
    height: 90,
    image: resources.car1
  },
  X: {
    width: 175,
    height: 90,
    image: resources.car2
  },
  O: {
    width: 106,
    height: 95,
    image: resources.tree1
  }
}

class Decoration extends enchant.Sprite {
  constructor (type, x, y) {
    super(type.width, type.height)
    this.image = enchant.Game.instance.assets[type.image]
    this.x = x
    this.y = y
    this.rotation = type.rotation || 0
  }
}

export default function buildDecoration(tile, x, y) {
  const type = types[tile]
  if (type) return new Decoration (type, x, y)
}
