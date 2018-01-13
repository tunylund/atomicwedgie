import { quote, wedgied, banzaid } from './texts.mjs'

class ActiveTextList {

  constructor () {
    this.div = document.createElement("div")
    this.div.className = "activeTextList"
    this.max = 12
    this.texts = []
    this.div.addEventListener(enchant.ENV.VENDOR_PREFIX + "TransitionEnd", e => this.removeOldestText())
    this.replaceOnDom()
  }

  removeOldestText () {
    const oldT = this.texts.splice(0, 1)
    this.div.removeChild(oldT[0])
  }

  add (text) {
    if(this.texts.length == this.max) {
      this.removeOldestText()
    }
    const t = document.createElement("div")
    t.innerHTML = text
    this.texts.push(t)
    this.div.appendChild(t)
    setTimeout(function() {
      t.className += " hidden"
    }, 10)
  }

  replaceOnDom () {
    const stage = document.getElementById("enchant-stage")
    stage.appendChild(this.div)
  }

}

class ScoreLabel extends enchant.EventTarget {

  constructor (labelText, x, y, score, icon, className) {
    super()
    this.div = document.createElement("div")
    this.div.className = "scoreLabel " + (className || "")
    this.div.style.left = x + "px"
    this.div.style.top = y + "px"
    this._label = document.createElement("span")
    if(icon) {
      this._label.innerHTML = "<i class='" + icon + "'></i>"
    } else {
      this._label.innerHTML = labelText
    }
    this.div.appendChild(this._label)
    this.scoreEl = document.createElement("span")
    this.score = score || 0
    this.div.appendChild(this.scoreEl)
    this.replaceOnDom()
  }

  get score() {
    return this._score
  }
  
  set score(score) {
    if(score != this._score) {
      this._score = score
      this.scoreEl.innerHTML = this._score          
    }
  }

  get label() {
    return this._label
  }
  set label (text) {
    this._label.innerHTML = text
  }

  replaceOnDom () {
    const stage = document.getElementById("enchant-stage")
    stage.appendChild(this.div)
  }
}

class TimeLabel extends ScoreLabel {

  constructor (time, x = 15, y = 15) {
    super("", x, y);
    this.div.className += " timeLabel"
    this._time = 0;
    this._count = -1;
    this.proxy = () => this.onEnterFrame()
    this.time = time
  }

  onEnterFrame () {
    let secs = (this._time / enchant.Game.instance.fps).toFixed(0),
        mins = Math.floor(secs / 60),
        sec = secs - (mins*60)
    
    if(mins == 0)
      mins = ""
    else 
      mins += "."

    if(sec < 10)
      sec = "0" + sec
    
    this._time += this._count;
    this.score = mins + sec;

    if(this._time < 0) {
      this._isListening = false
      enchant.Game.instance.removeEventListener("enterframe", this.proxy)
    }
  }

  get time () {
    return Math.floor(this._time / enchant.Game.instance.fps);
  }
  set time(newtime) {
    this._time = newtime * enchant.Game.instance.fps;
    if(!this._isListening) {
      this._isListening = true
      enchant.Game.instance.on("enterframe", this.proxy)
    }
  }

  remove () {
    enchant.Game.instance.removeEventListener("enterframe", this.proxy)
    this.div.parentNode.removeChild(this.div)
  }

}

class ScoreTable {

  constructor (result) {
    const stage = document.getElementById("enchant-stage")
    this.div = document.createElement("div")
    this.div.className = "scoreTable"
    this.nextGameIn = new TimeLabel(result.nextGameIn / 1000, 0, 15)
    this.nextGameIn.label = "Next game in: "
    this.div.appendChild(this.nextGameIn.div)

    this.scores = document.createElement("div")
    this.scores.className = "scores"
    this.div.appendChild(this.scores)

    for(let i in result.scores) {
      this.createScore(result.scores[i], i)
    }

    stage.appendChild(this.div)
  }

  createScore (scores, id) {
    const player = enchant.Game.instance.players[id]
    if(!player) return
    
    let row = document.createElement("div"),
        w = new ScoreLabel("", 0, 0, scores.wedgieCount, "wedgie"),
        b = new ScoreLabel("", 0, 0, scores.banzaiCount, "banzai"),
        d = new ScoreLabel("", 0, 0, scores.deathCount, "death"),
        s = new ScoreLabel("", 0, 0, scores.score, "score", "score"),
        name = document.createElement("div")
    
    name.innerHTML = player.name
    name.className = "name"
    row.className = player.color
    row.appendChild(name)
    row.appendChild(w.div)
    row.appendChild(b.div)
    row.appendChild(d.div)
    row.appendChild(s.div)
    this.scores.appendChild(row)
  }

  remove () {
    this.nextGameIn.remove()
    this.div.parentNode.removeChild(this.div)
  }

}

class TouchPad {

  constructor() {
    this.div = document.createElement("div")
    this.div.className = "touchPad"
    document.body.appendChild(this.div)
    this.width = this.height = 200
    this.h2 = this.w2 = 100
    this.x = this.div.offsetLeft
    this.y = this.div.offsetTop

    this.core = enchant.Game.instance
    this.input = { left: false, right: false, up: false, down: false };

    this.div.addEventListener('touchstart', e => this.touchStart(e))
    this.div.addEventListener('touchmove', e => this.touchMove(e))
    this.div.addEventListener('touchend', e => this.touchEnd(e))
  }

  touchStart (e) {
    this._updateInput(this._detectInput(e));
    e.preventDefault();
    if (!this.core.running) {
      e.stopPropagation();
    }
    return false
  }

  touchMove (e) {
    this._updateInput(this._detectInput(e));
    e.preventDefault();
    if (!this.core.running) {
      e.stopPropagation();
    }
    return false
  }

  touchEnd (e) {
    this._updateInput({ left: false, right: false, up: false, down: false });
    e.preventDefault();
    if (!this.core.running) {
      e.stopPropagation();
    }
    return false
  }
  _detectInput (e) {
    let core = this.core,
        touch = e.touches[e.touches.length - 1],
        x = (touch.pageX - this.x) - this.w2,
        y = (touch.pageY - this.y) - this.h2,
        input = { left: false, right: false, up: false, down: false };
    if (x * x + y * y > this.w2) {
      if (x < 0 && y < x * x * 0.1 && y > x * x * -0.1) {
        input.left = true;
      }
      if (x > 0 && y < x * x * 0.1 && y > x * x * -0.1) {
        input.right = true;
      }
      if (y < 0 && x < y * y * 0.1 && x > y * y * -0.1) {
        input.up = true;
      }
      if (y > 0 && x < y * y * 0.1 && x > y * y * -0.1) {
        input.down = true;
      }
    }
    return input;
  }
  _updateInput (input) {
    let core = this.core;
    ['left', 'right', 'up', 'down'].map(type => {
      if (this.input[type] && !input[type]) {
        core.changeButtonState(type, false);
      }
      if (!this.input[type] && input[type]) {
        core.changeButtonState(type, true);
      }
    })
    this.input = input
  }

}

class TouchArrows {

  constructor () {
    this.div = document.createElement("div")
    this.div.className = "touchArrows"
    document.body.appendChild(this.div)
    this.width = this.height = this.div.style.width
    this.h2 = this.w2 = this.width/2
    this.x = this.div.offsetLeft
    this.y = this.div.offsetTop

    this.core = enchant.Game.instance

    this.up = new TouchButton("&uarr;", "up", this.div)
    this.down = new TouchButton("&darr;", "down", this.div)
    this.left = new TouchButton("&larr;", "left", this.div)
    this.right = new TouchButton("&rarr;", "right", this.div)
  }

}

class TouchButton {

  constructor (text, type, container) {
    this.div = document.createElement("div")
    this.textEl = document.createElement("span")
    this.textEl.innerHTML = text
    this.type = type
    this.div.appendChild(this.textEl)
    this.className = "touchButton " + type
    this.div.className = this.className
    this.core = enchant.Game.instance;
    
    (container || document.body).appendChild(this.div)
    
    this.div.addEventListener('touchstart', e => this.touchStart(e));
    this.div.addEventListener('touchend', e => this.touchEnd(e))
  }

  touchStart (e) {
    this.div.className = this.className + " active"
    this.core.dispatchEvent(new enchant.Event(this.type + 'buttondown'));
    e.preventDefault();
    if (!this.core.running) {
      e.stopPropagation();
    }
  }

  touchEnd (e) {
    this.div.className = this.className
    this.core.dispatchEvent(new enchant.Event(this.type + 'buttonup'));
    e.preventDefault();
    if (!this.core.running) {
      e.stopPropagation();
    }
  }

}

class Insult {

  constructor (player, enemy) {
    const stage = document.getElementById("enchant-stage")
    this.div = document.createElement("div")
    this.div.className = "insult"
    this.div.innerHTML = player.wedgied ? wedgied(enemy) : banzaid(enemy)
    stage.appendChild(this.div)
    setTimeout(() => this.remove(), 5000)
  }

  remove () {
    this.div.parentNode.removeChild(this.div)
  }

}

class Quote {

  constructor () {
    const stage = document.getElementById("enchant-stage")
    this.div = document.createElement("div")
    this.div.className = "quote"
    this.div.innerHTML = quote()
    stage.appendChild(this.div)
    setTimeout(() => this.remove(), 5000)
  }

  remove () {
    this.div.parentNode.removeChild(this.div)
  }

}

const ui = {
  ScoreTable,
  Insult,
  Quote,

  makeHud: () => {
    const game = enchant.Game.instance
    return {
      lag: document.getElementById('lagValue'),
      texts: new ActiveTextList(),
      wedgieScoreLabel: new ScoreLabel("", game.width - 105, 15, 0, "wedgie"),
      banzaiScoreLabel: new ScoreLabel("", game.width - 65, 15, 0, "banzai"),
      time: new TimeLabel(0)
    }
  },

  makeTouchControls: () => {
    return {
      pad: new TouchPad(),
      a: new TouchButton("A", "a"),
      b: new TouchButton("B", "b")
    }
  }     
}

export default ui