module('tl.enchant.js', {
    setup: function() {
        enchant();
        var game = new Core();
        var sprite = new Sprite(32, 32);
        sprite.moveTo(0, 0);
        game.rootScene.addChild(sprite);
    },
    teardown: function() {

    }
});


test('tl.frameBased', function() {
    var sprite = enchant.Core.instance.rootScene.childNodes[0];

    equal(sprite.tl.isFrameBased, true);
    sprite.tl.setFrameBased();
    equal(sprite.tl.isFrameBased, true);
    sprite.tl.setTimeBased();
    equal(sprite.tl.isFrameBased, false);
    sprite.tl.setFrameBased();
    equal(sprite.tl.isFrameBased, true);
});

test('tl.activated', function() {
    var sprite = enchant.Core.instance.rootScene.childNodes[0];

    equal(sprite.tl._activated, false);
    var defaultListeners = sprite._listeners['enterframe'].length;

    sprite.tl.delay(30);

    equal(sprite.tl._activated, true);
    equal(sprite._listeners['enterframe'].length, defaultListeners + 1);

    var enterframe = new enchant.Event('enterframe');
    for (var i = 0; i < 30 - 1; i++) {
        sprite.dispatchEvent(enterframe);
    }

    equal(sprite.tl._activated, true);
    equal(sprite._listeners['enterframe'].length, defaultListeners + 1);

    sprite.dispatchEvent(enterframe);

    equal(sprite.tl._activated, false);
    equal(sprite._listeners['enterframe'].length, defaultListeners);
});



test('tl.delay.then', function() {
    var sprite = enchant.Core.instance.rootScene.childNodes[0];
    var then = false;
    sprite.tl.delay(30).then(function() {
        then = true;
    });
    ok(!then);

    var enterframe = new enchant.Event('enterframe');
    for (var i = 0; i < 30 - 1; i++) {
        sprite.dispatchEvent(enterframe);
    }

    ok(!then);
    sprite.dispatchEvent(enterframe);
    ok(then);

    sprite.tl.clear();
});


test('tl.delay x 2.then', function() {
    var sprite = enchant.Core.instance.rootScene.childNodes[0];
    var then = false;
    sprite.tl.delay(15).delay(15).then(function() {
        then = true;
    });
    ok(!then);

    var enterframe = new enchant.Event('enterframe');
    for (var i = 0; i < 30 - 1; i++) {
        sprite.dispatchEvent(enterframe);
    }

    ok(!then);
    sprite.dispatchEvent(enterframe);
    ok(then);

    sprite.tl.clear();
});

test('tl.tween', function() {
    var sprite = enchant.Core.instance.rootScene.childNodes[0];
    sprite.tl.moveTo(320, 320, 30);
    equal(sprite.x, 0);
    equal(sprite.y, 0);
    for (var i = 0; i < 30 - 1; i++) {
        var enterframe = new enchant.Event('enterframe');
        sprite.dispatchEvent(enterframe);
    }
    notEqual(Math.round(sprite.x, 5), 320);
    notEqual(Math.round(sprite.y, 5), 320);

    sprite.dispatchEvent(enterframe);
    equal(Math.round(sprite.x, 5), 320);
    equal(Math.round(sprite.y, 5), 320);
});

test('tl.tween (zero)', function() {
    var sprite = enchant.Core.instance.rootScene.childNodes[0];
    var then = false;
    sprite.tl.delay(1).moveTo(320, 320, 0).then(function(){
        then = true;
    });

    var enterframe = new enchant.Event('enterframe');
    sprite.dispatchEvent(enterframe);

    equal(Math.round(sprite.x, 5), 320);
    equal(Math.round(sprite.y, 5), 320);
    equal(then, true);
});

test('tl.multiMove', function() {
    var sprite = enchant.Core.instance.rootScene.childNodes[0];
    sprite.tl.clear();
    for (var i = 0; i < 10; i++) {
        sprite.tl.moveTo((i + 1) * 10, 0, 1);
    }
    equal(Math.round(sprite.x, 5), 0);
    var enterframe = new enchant.Event('enterframe');
    for (i = 0; i < 9; i++) {
        sprite.dispatchEvent(enterframe);
        notEqual(Math.round(sprite.x, 5), 0);
        notEqual(Math.round(sprite.x, 5), 100);
    }
    sprite.dispatchEvent(enterframe);
    equal(Math.round(sprite.x, 5), 100);
})

test('tl.tween', function() {
    var sprite = enchant.Core.instance.rootScene.childNodes[0];
    sprite.tl.moveTo(320, 320, 30);
    equal(sprite.x, 0);
    equal(sprite.y, 0);
    for (var i = 0; i < 30 - 1; i++) {
        var enterframe = new enchant.Event('enterframe');
        sprite.dispatchEvent(enterframe);
    }
    notEqual(Math.round(sprite.x, 5), 320);
    notEqual(Math.round(sprite.y, 5), 320);

    sprite.dispatchEvent(enterframe);
    equal(Math.round(sprite.x, 5), 320);
    equal(Math.round(sprite.y, 5), 320);
});


test('tl.tween (minus)', function() {
    var sprite = enchant.Core.instance.rootScene.childNodes[0];

    sprite.moveTo(200, 0);
    sprite.tl.moveBy(-200, 0, 8);
    equal(sprite.x, 200);

    for (var i = 0; i < 8; i++) {
        var enterframe = new enchant.Event('enterframe');
        sprite.dispatchEvent(enterframe);
    }
    equal(sprite.x, 0);
});


test('tl.fadeOut', function() {
    var sprite = enchant.Core.instance.rootScene.childNodes[0];
    sprite.tl.fadeOut(10);
    equal(sprite.opacity, 1);
    for (var i = 0; i < 10 - 1; i++) {
        var enterframe = new enchant.Event('enterframe');
        sprite.dispatchEvent(enterframe);
    }
    notEqual(sprite.opacity, 0);

    sprite.dispatchEvent(enterframe);
    equal(sprite.opacity, 0);
});

var periodTestingFunction = function(time, checkArray,period,sprite,property) {
    for(var j = 0; j < checkArray.length; j++) {
        if(checkArray[j][0] === time%period) {
            equal(sprite[property] === checkArray[j][1],checkArray[j][2],' ' + property + ' for time ' + time + ' testing: ' + checkArray[j][1] + ' === ' + sprite[property] + ', expecting ' + checkArray[j][2]);
        }
    }
};
/*
test('tl.multipleTl', function() {
    var sprite = enchant.Core.instance.rootScene.childNodes[0];
    var tl = new Timeline(sprite,true);
    tl.rotateTo(360,10).delay(2).rotateTo(0,10).delay(2).loop();
    var rotateCheck = [[0,0,true],[9,0,false],[10,360,true],
                   [11,360,false],[19,360,false],
                   [19,0,false]
                   ];
    var rotationPeriod = 20;
    
    tl = new Timeline(sprite,true);
    tl.delay(Math.round(Math.random()*10+5)).delay(Math.round(Math.random()*10+5))
    .delay(Math.round(Math.random()*10+5)).delay(Math.round(Math.random()*10+5));
    
    tl = new Timeline(sprite,true);
    tl.fadeOut(20).delay(2).fadeIn(20).delay(2).loop();
    var fadeCheck = [[0,1,true],[9,1,false],[19,1,false],[20,0,true],
                   [21,0,false],[29,0,false],[39,0,false],
                   [39,1,false]
                   ];
    var fadePeriod = 40;
    
    sprite.tl.moveTo(300,sprite.y,10).scaleTo(-1,1,1).delay(2).moveTo(0,sprite.y,10).scaleTo(1,1,1).delay(2).loop();
    
    var spriteTlMoveCheckX = [[0,0,true],[9,300,false],[10,300,true],
                              [11,300,false],[19,300,false],
                              [19,0,false]
                              ];
    var spriteTlMoveCheckPeriodX = 20;
    
    var spriteTlScaleCheckX = [[0,1,true],[9,-1,false],[10,-1,true],
                              [11,-1,true],[19,-1,true]];
    var spriteTlScaleCheckPeriodX = 20;
    
    var enterframe = new enchant.Event('enterframe');
    
    for (var i = 0; i < 200 - 1; i++) {
        equal(sprite.y,0,' testing sprite.y === 0');
        equal(sprite.scaleY,1,' testing sprite.scaleY === 1');
        periodTestingFunction(i, rotateCheck,rotationPeriod,sprite,'rotation');
        periodTestingFunction(i, fadeCheck,fadePeriod,sprite,'opacity');
        periodTestingFunction(i, spriteTlMoveCheckX,spriteTlMoveCheckPeriodX,sprite,'x');
        periodTestingFunction(i, spriteTlScaleCheckX,spriteTlScaleCheckPeriodX,sprite,'scaleX');
        
        enterframe.elapsed = Math.round((Math.random()*50+10));
        sprite.dispatchEvent(enterframe);
    }
});
*/

/* time based testing */

test('tl.timebased.delay.then', function() {
    var sprite = enchant.Core.instance.rootScene.childNodes[0];
    sprite.tl.setTimeBased();
    var then = false;
    sprite.tl.delay(1000).then(function() {
        then = true;
    });
    ok(!then);

    var enterframe = new enchant.Event('enterframe');
    enterframe.elapsed = 33;
    var time = 0;
    for (var i = 0; i < 30; i++) {
        sprite.dispatchEvent(enterframe);
        time += enterframe.elapsed;
    }
    equal(time, 990);
    enterframe.elapsed = 10;
    ok(!then);
    sprite.dispatchEvent(enterframe);
    ok(then);

    sprite.tl.clear();
    sprite.tl.setFrameBased();
});

test('tl.timebased.tween', function() {
    var sprite = enchant.Core.instance.rootScene.childNodes[0];
    sprite.tl.setTimeBased();
    sprite.tl.moveTo(320, 320, 1000);
    equal(sprite.x, 0);
    equal(sprite.y, 0);
    var enterframe = new enchant.Event('enterframe');
    enterframe.elapsed = 6;
    var time = 0;
    for (var i = 0; i < 165; i++) {
        sprite.dispatchEvent(enterframe);
        time += enterframe.elapsed;
    }
    equal(time, 990);

    notEqual(Math.round(sprite.x, 5), 320);
    notEqual(Math.round(sprite.y, 5), 320);

    enterframe.elapsed = 10;
    sprite.dispatchEvent(enterframe);
    equal(Math.round(sprite.x, 5), 320);
    equal(Math.round(sprite.y, 5), 320);
    sprite.tl.setFrameBased();
    sprite.tl.clear();
});


test('tl.timebased.tween (minus)', function() {
    var sprite = enchant.Core.instance.rootScene.childNodes[0];
    sprite.tl.setTimeBased();
    sprite.moveTo(200, 0);
    sprite.tl.moveBy(-200, 0, 800);
    equal(sprite.x, 200);

    var enterframe = new enchant.Event('enterframe');
    enterframe.elapsed = 20;
    var time = 0;
    for (var i = 0; i < 40; i++) {
        sprite.dispatchEvent(enterframe);
        time += enterframe.elapsed;
    }
    equal(time, 800);
    equal(sprite.x, 0);
    sprite.tl.setFrameBased();
    sprite.tl.clear();
});


test('tl.timebased.fadeOut', function() {
    var sprite = enchant.Core.instance.rootScene.childNodes[0];
    sprite.tl.setTimeBased();
    sprite.tl.fadeOut(100);
    equal(sprite.opacity, 1);
    var enterframe = new enchant.Event('enterframe');
    enterframe.elapsed = 7;
    var time = 0;
    for (var i = 0; i < 14; i++) {
        sprite.dispatchEvent(enterframe);
        time += enterframe.elapsed;
    }
    equal(time, 98);
    notEqual(sprite.opacity, 0);

    enterframe.elapsed = 2;
    sprite.dispatchEvent(enterframe);
    equal(sprite.opacity, 0);
});


test('tl.timebased.tween (framebased with elapsed)', function() {
    var sprite = enchant.Core.instance.rootScene.childNodes[0];
    sprite.tl.moveTo(320, 320, 30);
    equal(sprite.x, 0);
    equal(sprite.y, 0);
    for (var i = 0; i < 30 - 1; i++) {
        var enterframe = new enchant.Event('enterframe');
        enterframe.elapsed = Math.round((Math.random() * 100));
        sprite.dispatchEvent(enterframe);
    }
    notEqual(Math.round(sprite.x, 5), 320);
    notEqual(Math.round(sprite.y, 5), 320);

    enterframe.elapsed = (Math.random() * 100).toFixed(0);
    sprite.dispatchEvent(enterframe);
    equal(Math.round(sprite.x, 5), 320);
    equal(Math.round(sprite.y, 5), 320);
});

test('tl.timebased.parallel (random time)', function() {
    var sprite = enchant.Core.instance.rootScene.childNodes[0];
    sprite.tl.moveTo(320, 320, 2000).and().scaleTo(100, 2000);
    sprite.tl.setTimeBased();
    equal(sprite.x, 0);
    equal(sprite.y, 0);
    equal(sprite._scaleX, 1);
    equal(sprite._scaleY, 1);
    var time = 0;
    while (time < 2000) {
        notEqual(Math.round(sprite.x * 1e5) / 1e5, 320);
        notEqual(Math.round(sprite.y * 1e5) / 1e5, 320);
        notEqual(Math.round(sprite._scaleX * 1e5) / 1e5, 100);
        notEqual(Math.round(sprite._scaleY * 1e5) / 1e5, 100);
        var enterframe = new enchant.Event('enterframe');
        enterframe.elapsed = Math.round((Math.random() * 100));
        sprite.dispatchEvent(enterframe);
        time += enterframe.elapsed;
    }

    equal(Math.round(sprite.x, 5), 320);
    equal(Math.round(sprite.y, 5), 320);
    equal(Math.round(sprite._scaleX, 5), 100);
    equal(Math.round(sprite._scaleY, 5), 100);
});

test('tl.parallel (random time)', function() {
    var sprite = enchant.Core.instance.rootScene.childNodes[0];
    sprite.tl.moveTo(100, 100, 20).and().scaleTo(100, 20);
    equal(sprite.x, 0);
    equal(sprite.y, 0);
    equal(sprite._scaleX, 1);
    equal(sprite._scaleY, 1);
    var time = 0;
    while (time < 20) {
        notEqual(Math.round(sprite.x * 1e5) / 1e5, 320);
        notEqual(Math.round(sprite.y * 1e5) / 1e5, 320);
        notEqual(Math.round(sprite._scaleX * 1e5) / 1e5, 100);
        notEqual(Math.round(sprite._scaleY * 1e5) / 1e5, 100);
        var enterframe = new enchant.Event('enterframe');
        enterframe.elapsed = Math.round((Math.random() * 100));
        sprite.dispatchEvent(enterframe);
        time += 1;
    }

    equal(Math.round(sprite.x, 5), 100);
    equal(Math.round(sprite.y, 5), 100);
    equal(Math.round(sprite._scaleX, 5), 100);
    equal(Math.round(sprite._scaleY, 5), 100);
});
