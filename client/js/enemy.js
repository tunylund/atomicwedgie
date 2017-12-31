define(["resources", "player"], function(res, Player) {

  var frameSequences = {
    stand: 0,
    walk: [8, 8, 8, 9, 9, 9, 10, 10, 10, 9, 9, 9],
    walkPerformWedgie: [5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, null],
    performWedgie: [0, 0, 0, 1, 1, 1, 2, 2, 2, 1, 1, 1, 0, null],
    wedgie: [16, 16, 16, 17, 17, 17, 18, 18, 18, 19, 19, 19, 20, 20, 20]
  }

  var Enemy = enchant.Class.create(Player, {
    
    initialize: function() {
      Player.call(this, 32, 32);
      this.image = enchant.Game.instance.assets[res.manGreen]
      this.frame = frameSequences.stand
      this.addEventListener('enterframe', this.onEnterFrame)

      this.x = enchant.Game.instance.width / 2 + 100
      this.y = enchant.Game.instance.height / 2
      this.w2 = this.width / 2
      this.h2 = this.height / 2
    },

    onEnterFrame: function () {
      this.cx = this.x + this.w2
      this.cy = this.y + this.h2
      this.opacity = enchant.Game.instance.shadows.getOpacity(this)
    },

    wedgie: function() {
      this.wedgied = true
    }

  });

  return Enemy

});