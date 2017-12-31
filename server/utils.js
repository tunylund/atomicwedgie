exports.firstNot = function(arr, value) {
  for(var i=0; i<arr.length; i++) {
    if(arr[i] != value) 
      return arr[i];
  }
};

exports.voidfn = function(){};

var id = 0;
exports.id = function(prefix) {
  return (prefix || "") + (id++);
};

exports.limit = function(v, max) {
  return v <= max ? v : max;
}

exports.HashList = function () {
  this.arr = [];
  this.hash = {};
  this.length = this.arr.length;
};
exports.HashList.prototype = {

  push: function(obj) {
    this.arr.push(obj);
    this.hash[obj.id] = this.arr[this.arr.length-1];
    this.length = this.arr.length;
  },
  
  remove: function(obj) {
    var id = obj;
    if(typeof obj == "object")
      id = obj.id;
    for(var i=0; i<this.arr.length; i++) {
      if(this.arr[i].id == id) {
        this.arr.splice(i,1);
        break;
      }
    }
    delete this.hash[id];
    this.length = this.arr.length;
  },
  
  allwith: function(obj) {
    var result = new exports.HashList();
    for(var i=0; i<this.length; i++) {
      var item = this.arr[i],
          accept = false;
      for(var j in obj) {
        if(item[j] === obj[j])
          accept = true;
      }
      if(accept) result.push(item);
    }
    return result;
  },

  allbut: function(obj) {
    var result = new exports.HashList();
    for(var i=0; i<this.length; i++) {
      var item = this.arr[i],
          accept = true;
      for(var j in obj) {
        if(item[j] === obj[j])
          accept = false;
      }
      if(accept) 
        result.push(item);
    }
    return result;
  },
  
  toJson: function() {
    var result = [];
    for(var i=0; i<this.length; i++) {
      result.push(this.arr[i].toJson());
    }
    return result;
  }

};

exports.collides = function(o1,o2,t) {
  if (!t) t=0;
  return !((o1.y+o1.h-1-t<o2.y+t) || (o1.y+t> o2.y+o2.h-1-t) || (o1.x+o1.w-1-t<o2.x+t) || (o1.x+t>o2.x+o2.w-1-t));
};

exports.mirror = function(origin, collision) {
  return {
    x: origin.w - collision.x - collision.w,
    y: collision.y,
    h: collision.h,
    w: collision.w
  };
};

exports.randomBetween = function(a, b) {
  a = a || 0
  b = b || 10
  return Math.floor((Math.random()*b)+a);
}

exports.randomFrom = function(arr) {
  return arr[exports.randomBetween(0, arr.length)]
}

exports.integerMapToAciiMap = function(src) {

  var res = [];
  var characterMap = [
    ' ',
    '%','-','/','\\','+',
    '#','G','[',']','*'
  ];
  
  for(var i=0, row = ""; i<src.length; i++) {
    row = row+characterMap[src[i]];
    if(row.length == 40) {
      res.push(row);
      row = "";
    }
  }
  return res;

}

var integerMap = [
    3,5,2,2,2,5,2,2,2,5,2,2,2,5,0,0,0,0,0,0,0,0,0,0,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,4,
    8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,
    8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,
    8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,5,2,2,5,5,2,2,5,5,2,2,5,5,2,4,
    8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,
    8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,
    8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,
    3,2,2,2,1,1,2,2,2,5,2,2,2,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,
    8,0,0,0,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,
    8,0,0,0,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,2,2,2,2,2,2,2,2,2,1,1,5,5,4,
    8,0,0,0,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,0,0,0,0,0,0,0,0,0,6,6,0,0,9,
    8,0,0,0,6,6,0,0,0,5,2,2,2,5,0,0,0,0,0,0,0,0,0,0,6,6,0,0,0,0,0,0,0,0,0,6,6,0,0,9,
    8,0,0,0,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,0,0,0,0,0,0,0,0,0,6,6,0,0,9,
    8,0,0,0,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,
    8,0,0,0,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,
    8,0,0,0,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,
    3,2,2,2,5,5,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,2,2,0,0,0,0,0,0,0,0,5,5,2,2,2,4,
    8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,
    8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,
    8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,
    8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,
    8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,6,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,
    3,2,5,0,0,0,0,5,2,4,0,0,0,0,0,0,0,0,6,6,6,6,0,0,0,0,0,0,0,0,3,2,5,0,0,0,0,5,2,4,
    8,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,6,6,6,6,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0,9,
    8,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0,9,
    8,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0,9,
    8,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0,9,
    7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7
  ];
