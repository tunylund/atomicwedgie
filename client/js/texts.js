define([], function() {

  const quotes = [
        'Dont you know video games will ruin your mind? Look what its done to your brain!',
        'Nudge, nudge, wink, wink. Know what I mean?',
        'Ring ring ring ring ring ring ring  - Bananaphone!',
        'Whos your Daddy?',
        'Stimpy, you stoopid eediot!',
        'Its not my fault you suck!',
        'You sick little monkey!',
        'Situation normal: all fucked up!',
        'I wish you cancer! Cancer in the head!',
        'You are so stupid! You cannot find ass with both hands!',
        'You suck ass. You see an ass and you suck it. You are an ass-sucker.',
        'You cannot win.',
        'God does not like you. He never wanted you. In all probability, he hates you.',
        'In the battle between you and the world, bet on the world.',
        'Your best just was not good enough.',
        'Not all pain is gain.',
        'For every winner, there are dozens of losers. Odds are that you are one of them.',
        'Not everyone gets to be an astronaut when they grow up.',
        'Before you attempt to beat the odds, be sure you could survive the odds beating you.',
        'It could be that the purpose of your life is only to serve as a warning to others.',
        'If at first you do not succeed, failure may be your style.',
        'If you cannot learn to do something well, learn to enjoy doing it poorly.',
        'The harder you try, the dumber you look.'
      ],
      wedgies = [
        'your boxers pulled',
        'squeezed up',
        'served',
        '0wned',
        'punkd',
        "humiliated",
        "wedgied",
        "nutsacksquished"
      ], 
      banzais = [
        'beat into bloody pulp',
        'mutilated',
        'smashed',
        'mugged',
        'mauled',
        'clobbered',
        "squished",
        "smashed",
        "liquified",
        "banzaid"
      ]

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
      
  return {
    quote: function() {
      return randomFrom(quotes);
    },
    wedgied: function(enemy) {
      return `You got ${randomFrom(wedgies)}  by ${enemy.name}!`;
    },
    banzaid: function(enemy) {
      if(Math.random() > 0.85) {
        return `${enemy.name} opened a can of whoopass on you!`;
      } else {
        return `You got ${randomFrom(banzais)} by ${enemy.name}!`;
      }
    }
  }

});