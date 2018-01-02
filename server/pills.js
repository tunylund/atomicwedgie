const u = require('./utils.js')

class Pill {

  constructor (x, y, type) {
    this.x = x
    this.y = y
    this.type = type
    this.id = u.id('pill')
  }

  get duration () {
    return 15000
  }

  applyEffect (player) {
    for(let i in this.effect) {
      player[i] = this.effect[i]
    }
  }

  clearEffect (player) {
    for(let i in this.clear) {
      player[i] = this.clear[i]
    }
  }
}

class Red extends Pill {
  constructor (x, y) {
    super(x, y, 'red')
  }
}

class Green extends Pill {
  constructor (x, y) {
    super(x, y, 'green')
  }

  get effect() {
    return {
      speedMultiplier: 1.5
    }
  }

  get clear() {
    return {
      speedMultiplier: 1
    }
  }
}

class Blue extends Pill {
  constructor (x, y) {
    super(x, y, 'blue')
  }
}

class Yellow extends Pill {
  constructor (x, y) {
    super(x, y, 'yellow')
  }
}

exports.getRandomPill = function(position) {
  const Type = u.randomFrom([Red, Green, Blue, Yellow])
  return new Type(position.x, position.y)
}
