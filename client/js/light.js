define(["resources"], function(res) {

  var Light = enchant.Class.create(enchant.Sprite, {
    
    initialize: function(player) {
      enchant.Sprite.call(this, 246, 197);
      this.image = enchant.Game.instance.assets[res.lightCone]
      this.angle = 76
      this.angle2 = Math.floor(this.angle/2)
      this.player = player
      this.w2 = Math.floor(this.width / 2)
      this.h2 = Math.floor(this.height / 2)
      this.offX = this.player.w2
      this.offY = - this.h2 + this.player.h2
      this.originX = 0
      this.originY = this.h2
      this.refresh()
    },

    refresh: function () {
      this.x = this.player.x + this.offX
      this.y = this.player.y + this.offY
      this.cx = Math.floor(this.x + this.w2)
      this.cy = Math.floor(this.y + this.h2)
      this.offsetX = this.player.offsetX + this.offX
      this.offsetY = this.player.offsetY + this.offY
      this.rotation = this.player.rotation
    }

  });

  return Light

});