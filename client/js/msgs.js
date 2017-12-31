msgs = {

  types: {
    number: {
      parse: Number,
      format: String
    },
    string: {
      parse: String,
      format: String
    },
    bool: {
      parse: function(val) { return Boolean(Number(val)); },
      format: Number,
    }
  }
  
}

msgs.formats = {

    update: [
      {name: "time",
        type: msgs.types.number},
      {name: "id",
       type: msgs.types.string},
      {name: "accx",
       type: msgs.types.number},
      {name: "accy", 
       type: msgs.types.number},
      {name: "x",
       type: msgs.types.number},
      {name: "y",
       type: msgs.types.number},
      {name: "isStriking",
       type: msgs.types.bool},
      {name: "frame",
       type: msgs.types.number}]
  };

msgs.parse = function(msg, format) {
    var a = msg.split(","),
      res = {};
    for(var i=0; i<a.length; i++) {
      var f = format[i];
      if(a[i] != "")
        res[f.name] = f.type.parse(a[i]);
    }
    return res;
  };

msgs.format = function(msg, format) {
    var res = "";
    for(var i=0; i<format.length; i++) {
      var f = format[i],
          val = msg[f.name];
      if(typeof val != "undefined") 
        val = f.type.format(msg[f.name]);
      else
        val = "";
      res += val + ",";
    }
    return res.substr(0,res.length-1);
  };

if(typeof exports != "undefined") {
  for(var i in msgs) {
    exports[i] = msgs[i];
  }
}
