var u = require('./utils.js')
exports.wedgie = function(victim, player) {
  var words = [
        'his boxers pulled',
        'squeezed up',
        'served',
        '0wned',
        'punkd',
        "humiliated",
        "wedgied",
        "nutsacksquished"
      ], 
      r = u.randomBetween(0, words.length-1)
  return victim.name + " got " + words[r] + " by " + player.name
}

exports.banzai = function(victim, player) {
  var words = [
        'beat into bloody pulp',
        'mutilated',
        'smashed',
        'mugged',
        'mauled',
        'clobbered',
        "squished",
        "smashed",
        "liquified",
        "banzaid"
      ], 
      r = u.randomBetween(0, words.length-1)
  return victim.name + " got " + words[r] + " by " + player.name
}
