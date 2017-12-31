$(function() {

  if(Math.random() > 0.75) {
    setTimeout(function() {
      var w = $("#wedgie").addClass("animated hinge")
    }, 5000)    
  }

  $.getJSON("/status", function(response) {

    for(var i=0; i<response.players.length; i++) {
      var player = response.players[i]
      $("[name=color][value=" + player.color + "]").closest("label").addClass("taken")
    }

    var startTime = response.startTime;
    if(startTime != null) {

      runtimeInterval = setInterval(function() {
      
        var now = new Date().getTime(),
          runtime = now - startTime,
          days = Math.floor(runtime / 1000 / 60 / 60 / 24, 10),
          hours = Math.floor(runtime / 1000 / 60 / 60 % 24),
          minutes = Math.floor(runtime / 1000 / 60 % 60),
          seconds = Math.floor(runtime / 1000 % 60);

        $("#runtime").html(
          (days > 0 ? days + " days " : "") 
          + (hours > 0 ? hours + "h " : "" )
          + minutes + "min " + seconds + "s");

      }, 1000);
      
    }
  
  
  }).error(function() {
    $("#rooms").html(0);
    $("#players").html(0);
    $("#runtime").html("Server is down at the moment");
  });
  
  $("#join").click(function() {
    
    localStorage.setItem("character", JSON.stringify({
      color: $("[name=color]:checked").val(),
      name: $("[name=name]").val()
    }));
    
    window.location = "game.html"
  });
  
  try {
    var c = JSON.parse(localStorage.getItem("character"));
    $("[name=color][value=" + c.color + "]").attr("checked", true).trigger("change");
    $("[name=name]").val(c.name);
  } catch (e) {
    console.info("no old credentials found");
  }

});
