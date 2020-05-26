
export function randomBetween(a = 0, b = 10) {
  return Math.floor((Math.random()*b)+a);
}

export function randomFrom(arr: any[]) {
  return arr[randomBetween(0, arr.length)]
}
