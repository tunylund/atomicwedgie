enum Asset {
  grass = "img/floors/grass-huge.png",
  grassHuge2 = "img/floors/grass2-huge.png",
  largeMarble = "img/floors/largemarble-huge.png",
  largeConcrete = "img/floors/concrete-large.png",
  largeTile = "img/floors/tile-large.png",
  walls = "img/walls/walls.png",
  blood = "img/players/blood/blood.png",
  stats = "img/menu-backgrounds/stats.bmp",
  
  [`man-green`] = "img/players/man1.png",
  [`man-green-banzaiwalk`] = "img/players/banzai-walk/man1-banzaiwalk.png",
  [`man-green-banzai`] = "img/players/perform-banzai/man1-perform-banzai.png",
  [`man-blue`] = "img/players/man2.png",
  [`man-blue-banzaiwalk`] = "img/players/banzai-walk/man2-banzaiwalk.png",
  [`man-blue-banzai`] = "img/players/perform-banzai/man2-perform-banzai.png",
  [`man-orange`] = "img/players/man3.png",
  [`man-orange-banzaiwalk`] = "img/players/banzai-walk/man3-banzaiwalk.png",
  [`man-orange-banzai`] = "img/players/perform-banzai/man3-perform-banzai.png",
  [`man-brown`] = "img/players/man4.png",
  [`man-brown-banzaiwalk`] = "img/players/banzai-walk/man4-banzaiwalk.png",
  [`man-brown-banzai`] = "img/players/perform-banzai/man4-perform-banzai.png",
  [`man-purple`] = "img/players/man5.png",
  [`man-purple-banzaiwalk`] = "img/players/banzai-walk/man5-banzaiwalk.png",
  [`man-purple-banzai`] = "img/players/perform-banzai/man5-perform-banzai.png",
  [`man-yellow`] = "img/players/man6.png",
  [`man-yellow-banzaiwalk`] = "img/players/banzai-walk/man6-banzaiwalk.png",
  [`man-yellow-banzai`] = "img/players/perform-banzai/man6-perform-banzai.png",
  
  pillRed = "img/decorations/pilleri punainen.gif",
  pillGreen = "img/decorations/pilleri vihreä.gif",
  pillBlue = "img/decorations/pilleri sininen.gif",
  pillYellow = "img/decorations/pilleri keltainen.gif",
  lightCone = "img/lights/conelight_1.png",
  pad = 'img/pad.png',

  biliardTable = 'img/decorations/biljardipöytä.gif',
  chair = 'img/decorations/tuoli2.gif',
  chair2 = 'img/decorations/tuoli1.gif',
  toilet = 'img/decorations/pytty.gif',
  sink = 'img/decorations/pesulaari.gif',
  cauch = 'img/decorations/sohva.gif',
  table = 'img/decorations/pöytä2.gif',
  table2 = 'img/decorations/pöytä1.gif',
  table3 = 'img/decorations/pöytä3.gif',
  car1 = 'img/decorations/auto1.gif',
  car2 = 'img/decorations/auto2.gif',
  tree1 = 'img/decorations/puu2.gif',

  // walk1 = 'sounds/walk/2.wav',
  // walk2 = 'sounds/walk/4.wav',
  // walk3 = 'sounds/walk/5.wav',

  // pill1 = 'sounds/pills/1.wav',
  // pill2 = 'sounds/pills/2.wav',
  // pill3 = 'sounds/pills/3.wav',
  // uliuliuli = 'sounds/uliuliuli/3.wav',

  // performWedgie1 = 'sounds/perform-wedgie/1.wav',
  // performWedgie2 = 'sounds/perform-wedgie/2.wav',
  // performWedgie3 = 'sounds/perform-wedgie/3.wav',
  // performWedgie4 = 'sounds/perform-wedgie/4.wav',

  // performBanzai1 = 'sounds/perform-banzai/1.wav',
  // performBanzai2 = 'sounds/perform-banzai/2.wav',
  // performBanzai3 = 'sounds/perform-banzai/3.wav',

  // banzaiScream1 = 'sounds/banzai-scream/1.wav',
  // banzaiScream2 = 'sounds/banzai-scream/2.wav',
  // banzaiScream3 = 'sounds/banzai-scream/3.wav',

  // laugh1 = 'sounds/laugh/1.wav',
  // laugh2 = 'sounds/laugh/2.wav',
  // laugh3 = 'sounds/laugh/3.wav',
  // laugh4 = 'sounds/laugh/4.wav',
  // laugh5 = 'sounds/laugh/5.wav',
  // laugh6 = 'sounds/laugh/6.wav',

  // arrgh1 = 'sounds/arrgh/1.wav',
  // arrgh2 = 'sounds/arrgh/2.wav',
  // arrgh3 = 'sounds/arrgh/3.wav',
  // arrgh4 = 'sounds/arrgh/4.wav'
}

type AssetKey = keyof typeof Asset;
const assets = new Map<AssetKey, HTMLImageElement|AudioBufferSourceNode>()

function loadImage(url: string): Promise<HTMLImageElement> {
  return fetch(url)
    .then(response => response.blob())
    .then(blob => {
      const image = new Image()
      image.src = URL.createObjectURL(blob)
      return image
  })
}

const audioCtx = new AudioContext()
function loadSound(url: string): Promise<AudioBufferSourceNode> {
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

function load(key: string, url: string) {
  const isImage = url.endsWith('gif') || url.endsWith('png') || url.endsWith('bmp')
  const isSound = url.endsWith('wav') || url.endsWith('mp3')
  const loader = isImage ? loadImage : isSound ? loadSound : null
  if (loader) {
    // @ts-ignore
    return loader(url).then((resource: any) => assets.set(key, resource))
      .catch((err: any) => console.error(err))
  }

  return Promise.reject(`unsupported resource type ${url}`)
}

function preload() {
  return Promise.all(Object.entries(Asset)
    .map(([key, url]) => load(key, url)))
    .then(() => console.log(`loaded ${assets.size} assets`))
}

function getAsset<T extends HTMLImageElement | AudioBufferSourceNode>(asset: AssetKey): T {
  const r = assets.get(asset)
  if (r === undefined) throw new Error(`asset ${asset} is not available`)
  else return r as T
}

export { preload, getAsset, AssetKey }
