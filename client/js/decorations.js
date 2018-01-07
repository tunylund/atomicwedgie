define(["resources"], function(res) {

  const types = {
    B: {
      width: 128,
      height: 77,
      image: res.biliardTable
    },
    C: {
      width: 32,
      height: 29,
      image: res.chair
    },
    K: {
      width: 30,
      height: 32,
      image: res.chair2
    },
    Q: {
      width: 30,
      height: 32,
      image: res.chair2,
      rotation: 180
    },
    W: {
      width: 32,
      height: 48,
      image: res.toilet
    },
    S: {
      width: 32,
      height: 32,
      image: res.sink
    },
    H: {
      width: 96,
      height: 34,
      image: res.cauch
    },
    T: {
      width: 128,
      height: 48,
      image: res.table
    },
    L: {
      width: 48,
      height: 128,
      image: res.table2
    },
    P: {
      width: 77,
      height: 58,
      image: res.table3
    },
    Z: {
      width: 175,
      height: 90,
      image: res.car1
    },
    X: {
      width: 175,
      height: 90,
      image: res.car2
    },
    O: {
      width: 106,
      height: 95,
      image: res.tree1
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

  return {
    types: types,
    Decoration: Decoration
  }

})