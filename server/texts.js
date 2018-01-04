const u = require('./utils.js')

function wedgie(victim, player) {
  const words = [
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
  return `${victim.name} got ${words[r]} by ${player.name}`
}

function banzai(victim, player) {
  const words = [
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
  return `${victim.name} got ${words[r]} by ${player.name}`
}

module.exports = {
  wedgie,
  banzai
}