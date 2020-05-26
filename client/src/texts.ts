
const goodAdjectives = [
  'smashing', 'spectacular', 'awesomeballs',
  'finalizing', 'superlicious', 'supreme',
  'extravagant'
]
const badAdjectives = [
  'grinding', 'gruesome', 'painful', 'smearing'
]

function randomFrom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function goodAdjective() {
  return randomFrom(goodAdjectives)
}
export function badAdjective() {
  return randomFrom(badAdjectives)
}