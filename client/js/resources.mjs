const resources = {
  grass: "img/floors/grass-huge.png",
  grassHuge2: "img/floors/grass2-huge.png",
  largeMarble: "img/floors/largemarble-huge.png",
  largeConcrete: "img/floors/concrete-large.png",
  largeTile: "img/floors/tile-large.png",
  walls: "img/walls/walls.png",
  blood: "img/players/blood/blood.png",
  
  manGreen: "img/players/man1.png",
  manGreenBanzaiWalk: "img/players/banzai-walk/man1-banzaiwalk.png",
  manGreenPerformBanzai: "img/players/perform-banzai/man1-perform-banzai.png",
  manBlue: "img/players/man2.png",
  manBlueBanzaiWalk: "img/players/banzai-walk/man2-banzaiwalk.png",
  manBluePerformBanzai: "img/players/perform-banzai/man2-perform-banzai.png",
  manOrange: "img/players/man3.png",
  manOrangeBanzaiWalk: "img/players/banzai-walk/man3-banzaiwalk.png",
  manOrangePerformBanzai: "img/players/perform-banzai/man3-perform-banzai.png",
  manBrown: "img/players/man4.png",
  manBrownBanzaiWalk: "img/players/banzai-walk/man4-banzaiwalk.png",
  manBrownPerformBanzai: "img/players/perform-banzai/man4-perform-banzai.png",
  manPurple: "img/players/man5.png",
  manPurpleBanzaiWalk: "img/players/banzai-walk/man5-banzaiwalk.png",
  manPurplePerformBanzai: "img/players/perform-banzai/man5-perform-banzai.png",
  manYellow: "img/players/man6.png",
  manYellowBanzaiWalk: "img/players/banzai-walk/man6-banzaiwalk.png",
  manYellowPerformBanzai: "img/players/perform-banzai/man6-perform-banzai.png",
  
  pillRed: "img/decorations/pilleri punainen.gif",
  pillGreen: "img/decorations/pilleri vihreä.gif",
  pillBlue: "img/decorations/pilleri sininen.gif",
  pillYellow: "img/decorations/pilleri keltainen.gif",
  lightCone: "img/lights/conelight_1.png",
  pad: 'img/pad.png',

  biliardTable: 'img/decorations/biljardipöytä.gif',
  chair: 'img/decorations/tuoli2.gif',
  chair2: 'img/decorations/tuoli1.gif',
  toilet: 'img/decorations/pytty.gif',
  sink: 'img/decorations/pesulaari.gif',
  cauch: 'img/decorations/sohva.gif',
  table: 'img/decorations/pöytä2.gif',
  table2: 'img/decorations/pöytä1.gif',
  table3: 'img/decorations/pöytä3.gif',
  car1: 'img/decorations/auto1.gif',
  car2: 'img/decorations/auto2.gif',
  tree1: 'img/decorations/puu2.gif',

  walk1: 'sounds/walk/2.wav',
  walk2: 'sounds/walk/4.wav',
  walk3: 'sounds/walk/5.wav',

  pill1: 'sounds/pills/1.wav',
  pill2: 'sounds/pills/2.wav',
  pill3: 'sounds/pills/3.wav',
  uliuliuli: 'sounds/uliuliuli/3.wav',

  performWedgie1: 'sounds/perform-wedgie/1.wav',
  performWedgie2: 'sounds/perform-wedgie/2.wav',
  performWedgie3: 'sounds/perform-wedgie/3.wav',
  performWedgie4: 'sounds/perform-wedgie/4.wav',

  performBanzai1: 'sounds/perform-banzai/1.wav',
  performBanzai2: 'sounds/perform-banzai/2.wav',
  performBanzai3: 'sounds/perform-banzai/3.wav',

  banzaiScream1: 'sounds/banzai-scream/1.wav',
  banzaiScream2: 'sounds/banzai-scream/2.wav',
  banzaiScream3: 'sounds/banzai-scream/3.wav',

  laugh1: 'sounds/laugh/1.wav',
  laugh2: 'sounds/laugh/2.wav',
  laugh3: 'sounds/laugh/3.wav',
  laugh4: 'sounds/laugh/4.wav',
  laugh5: 'sounds/laugh/5.wav',
  laugh6: 'sounds/laugh/6.wav',

  arrgh1: 'sounds/arrgh/1.wav',
  arrgh2: 'sounds/arrgh/2.wav',
  arrgh3: 'sounds/arrgh/3.wav',
  arrgh4: 'sounds/arrgh/4.wav'
}

export const assets = new Map()

function loadImage(url) {
  return fetch(url)
    .then(response => response.blob())
    .then(blob => {
      const image = new Image()
      image.src = URL.createObjectURL(blob)
      return image
  })
}

const audioCtx = new AudioContext()
function loadSound(url) {
  return fetch(url)
    .then(response => response.arrayBuffer())
    .then(buffer => {
      const source = audioCtx.createBufferSource()
      audioCtx.decodeAudioData(buffer, function(decodedData) {
        source.buffer = decodedData
        source.connect(audioCtx.destination)
      })
      return source
  })
}

function load(key, url) {
  const isImage = url.endsWith('gif') || url.endsWith('png')
  const isSound = url.endsWith('wav') || url.endsWith('mp3')
  
  const loader = isImage ? loadImage : isSound ? loadSound : () => Promise.reject(`unsupported resource type ${url}`)
  return loader(url)
    .then(resource => assets.set(key, resource))
    .catch(err => console.error(err))
}

export async function preload() {
  await Promise.all(Object.entries(resources)
    .map(([key, url]) => load(key, url)))
    .then(() => console.log(`loaded ${assets.size} assets`))
}

export default resources
