const u = require('./utils.js')

const wedgieWords = [
  'his boxers pulled',
  'squeezed up',
  'served',
  '0wned',
  'punkd',
  "humiliated",
  "wedgied",
  "nutsacksquished"
]
const banzaiWords = [
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
]

module.exports = {
  wedgie: (victimName, playerName) => `${victimName} got ${u.randomFrom(wedgieWords)} by ${playerName}`,
  banzai: (victimName, playerName) => `${victimName} got ${u.randomFrom(banzaiWords)} by ${playerName}`
}