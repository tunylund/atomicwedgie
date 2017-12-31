define(['texts'], function(texts) {

  var ActiveTextList = enchant.Class.create({

    initialize: function() {
      var stage = document.getElementById("enchant-stage")
      this.div = document.createElement("div")
      this.div.className = "activeTextList"
      stage.appendChild(this.div)
      this.max = 12
      this.texts = []
      this.div.addEventListener(enchant.ENV.VENDOR_PREFIX + "TransitionEnd", function(entity) {
        return function(e) {
          entity.onTransitionEnd(e)
        }
      }(this))
    },

    onTransitionEnd: function(e) {
      var oldT = this.texts.splice(0, 1)
      this.div.removeChild(oldT[0])
    },

    add: function(text) {
      if(this.texts.length == this.max) {
        var oldT = this.texts.splice(0, 1)
        this.div.removeChild(oldT[0])
      }
      var t = document.createElement("div")
      t.innerHTML = text
      this.texts.push(t)
      this.div.appendChild(t)
      setTimeout(function() {
        t.className += " hidden"
      }, 10)
    }

  })

  var ScoreLabel = enchant.Class.create(enchant.EventTarget, {

    initialize: function(labelText, x, y, score, icon, className) {
      enchant.EventTarget.call(this)
      var stage = document.getElementById("enchant-stage")
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
      stage.appendChild(this.div)
    },

    score: {
      get: function() {
        return this._score
      },
      set: function(score) {
        if(score != this._score) {
          this._score = score
          this.scoreEl.innerHTML = this._score          
        }
      }
    },

    label: {
      get: function() {
        return this._label
      },
      set: function(text) {
        this._label.innerHTML = text
      }
    }

  })

  var TimeLabel = enchant.Class.create(ScoreLabel, {

    initialize: function(time) {
      ScoreLabel.call(this, "", 15, 15);
      this.div.className += " timeLabel"
      this._time = 0;
      this._count = -1;
      this.proxy = (function(entity) {
        return function() { entity.onEnterFrame() }
      })(this)
      this.time = time
    },

    onEnterFrame: function() {
      var secs = (this._time / enchant.Game.instance.fps).toFixed(0),
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
    },

    time: {
      get: function() {
        return Math.floor(this._time / enchant.Game.instance.fps);
      },
      set: function(newtime) {
        this._time = newtime * enchant.Game.instance.fps;
        if(!this._isListening) {
          this._isListening = true
          enchant.Game.instance.on("enterframe", this.proxy)
        }
      }
    },

    remove: function() {
      enchant.Game.instance.removeEventListener("enterframe", this.proxy)
      this.div.parentNode.removeChild(this.div)
    }

  })

  var ScoreTable = enchant.Class.create({

    initialize: function(result) {
      var stage = document.getElementById("enchant-stage")
      this.div = document.createElement("div")
      this.div.className = "scoreTable"
      this.nextGameIn = new TimeLabel(result.nextGameIn / 1000)
      this.nextGameIn.label = "Next game in: "
      this.div.appendChild(this.nextGameIn.div)

      this.scores = document.createElement("div")
      this.scores.className = "scores"
      this.div.appendChild(this.scores)

      for(var i in result.scores) {
        this.createScore(result.scores[i], i)
      }

      stage.appendChild(this.div)
    },

    createScore: function(scores, id) {
      var player = enchant.Game.instance.players[id]
      if(!player) return
      
      var row = document.createElement("div"),
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
    },

    remove: function() {
      this.nextGameIn.remove()
      this.div.parentNode.removeChild(this.div)
    }

  })

  var TouchPad = enchant.Class.create({

    initialize: function() {
      this.div = document.createElement("div")
      this.div.className = "touchPad"
      document.body.appendChild(this.div)
      this.width = this.height = 200
      this.h2 = this.w2 = 100
      this.x = this.div.offsetLeft
      this.y = this.div.offsetTop

      this.core = enchant.Game.instance
      this.input = { left: false, right: false, up: false, down: false };

      this.div.addEventListener('touchstart', function(entity) {
        return function(e) { entity.touchStart(e) }
      }(this));
      this.div.addEventListener('touchmove', function(entity) {
        return function(e) { entity.touchMove(e) }
      }(this));
      this.div.addEventListener('touchend', function(entity) {
        return function(e) { entity.touchEnd(e) }
      }(this));
    },

    touchStart: function(e) {
      this._updateInput(this._detectInput(e));
      e.preventDefault();
      if (!this.core.running) {
        e.stopPropagation();
      }
      return false
    },

    touchMove: function(e) {
      this._updateInput(this._detectInput(e));
      e.preventDefault();
      if (!this.core.running) {
        e.stopPropagation();
      }
      return false
    },

    touchEnd: function(e) {
      this._updateInput({ left: false, right: false, up: false, down: false });
      e.preventDefault();
      if (!this.core.running) {
        e.stopPropagation();
      }
      return false
    },
    _detectInput: function(e) {
      var core = this.core,
          x = (e.pageX - this.x) - this.w2,
          y = (e.pageY - this.y) - this.h2,
          input = { left: false, right: false, up: false, down: false };
      if (x * x + y * y > 200) {
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
    },
    _updateInput: function(input) {
      var core = this.core;
      ['left', 'right', 'up', 'down'].forEach(function(type) {
        if (this.input[type] && !input[type]) {
          core.dispatchEvent(new enchant.Event(type + 'buttonup'));
        }
        if (!this.input[type] && input[type]) {
          core.dispatchEvent(new enchant.Event(type + 'buttondown'));
        }
      }, this);
      this.input = input;
    }

  })

  var TouchArrows = enchant.Class.create({

    initialize: function() {
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

  })

  var TouchButton = enchant.Class.create({

    initialize: function(text, type, container) {
      this.div = document.createElement("div")
      this.textEl = document.createElement("span")
      this.textEl.innerHTML = text
      this.type = type
      this.div.appendChild(this.textEl)
      this.className = "touchButton " + type
      this.div.className = this.className
      this.core = enchant.Game.instance;
      
      (container || document.body).appendChild(this.div)
      
      this.div.addEventListener('touchstart', function(entity) {
        return function(e) { entity.touchStart(e) }
      }(this));
      
      this.div.addEventListener('touchend', function(entity) {
        return function(e) { entity.touchEnd(e) }
      }(this));
    },

    touchStart: function(e) {
      this.div.className = this.className + " active"
      this.core.dispatchEvent(new enchant.Event(this.type + 'buttondown'));
      e.preventDefault();
      if (!this.core.running) {
        e.stopPropagation();
      }
    },

    touchEnd: function(e) {
      this.div.className = this.className
      this.core.dispatchEvent(new enchant.Event(this.type + 'buttonup'));
      e.preventDefault();
      if (!this.core.running) {
        e.stopPropagation();
      }
    }

  })

  var Insult = enchant.Class.create({

    initialize: function(player, enemy) {
      var stage = document.getElementById("enchant-stage")
      this.div = document.createElement("div")
      this.div.className = "insult"
      this.div.innerHTML = texts[player.wedgied ? 'wedgied' : 'banzaid'](enemy)
      stage.appendChild(this.div)
      setTimeout(function(entity) {
        return function() { entity.remove() }
      }(this), 5000)
    },

    remove: function() {
      this.div.parentNode.removeChild(this.div)
    }

  })

  var Quote = enchant.Class.create({

    initialize: function() {
      var stage = document.getElementById("enchant-stage")
      this.div = document.createElement("div")
      this.div.className = "quote"
      this.div.innerHTML = texts.quote()
      stage.appendChild(this.div)
      setTimeout(function(entity) {
        return function() { entity.remove() }
      }(this), 5000)
    },

    remove: function() {
      this.div.parentNode.removeChild(this.div)
    }

  })

  return {
    ActiveTextList: ActiveTextList,
    ScoreLabel: ScoreLabel,
    TimeLabel: TimeLabel,
    ScoreTable: ScoreTable,
    TouchArrows: TouchArrows,
    TouchPad: TouchPad,
    TouchButton: TouchButton,
    Insult: Insult,
    Quote: Quote
  }

});