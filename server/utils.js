let _id = 0
function id(prefix = '') {
  return prefix + (_id++)
}

function randomBetween(a = 0, b = 10) {
  return Math.floor((Math.random()*b)+a);
}

function randomFrom(arr) {
  return arr[randomBetween(0, arr.length)]
}

class Timer {

  constructor(fn, duration) {
    this.fn = fn
    this.duration = duration
  }

  start (duration) {
    this.stop()
    this.duration = duration || this.duration
    this.token = setTimeout(() => {
      this.stop()
      this.fn()
    }, this.duration)
    this.startTime = new Date().getTime()
  }

  stop () {
    clearTimeout(this.token)
    this.token = null
    this.startTime = 0
  }

  get isTicking () {
    return this.token != null
  }

  get timeLeft () {
    return this.startTime + this.duration - new Date().getTime()
  }

}

module.exports = {
  Timer,
  id,
  randomBetween,
  randomFrom
}