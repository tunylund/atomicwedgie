var u = require('./utils.js')

var Pill = {
  duration: 15000,
  applyEffect: function(player) {
    for(var i in this.effect) {
      player[i] = this.effect[i]
    }
  },
  clearEffect: function(player) {
    for(var i in this.clear) {
      player[i] = this.clear[i]
    }
  }
}

var pills = {

  red: function() {
    this.type = "red"
  },

  green: function() {
    this.type = "green"
    this.effect = {
      speedMultiplier: 1.5
    },
    this.clear = {
      speedMultiplier: 1
    }
  },

  blue: function() {
    this.type = "blue"
  },

  yellow: function() {
    this.type = "yellow"
  }
}
var pillTypes = []
for(var i in pills) {
  pills[i].prototype = Pill
  pillTypes.push(i)
}


exports.pill = function(type, position) {
  var p = new pills[type]()
  p.x = position.x
  p.y = position.y
  p.id = u.id("pill")
  return p
}
exports.pillTypes = pillTypes