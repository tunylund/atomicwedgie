import { AssetKey } from "../../types/types"

const assets = new Map<AssetKey, HTMLImageElement|AudioBufferSourceNode>()

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
  
  [`pill-red`] = "img/decorations/pilleri punainen.gif",
  [`pill-green`] = "img/decorations/pilleri vihreä.gif",
  [`pill-blue`] = "img/decorations/pilleri sininen.gif",
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

  [`walk-1`] = 'sounds/walk/2.wav',
  [`walk-2`] = 'sounds/walk/4.wav',
  [`walk-3`] = 'sounds/walk/5.wav',

  [`pill-1`] = 'sounds/pills/1.wav',
  [`pill-2`] = 'sounds/pills/2.wav',
  [`pill-3`] = 'sounds/pills/3.wav',
  uliuliuli = 'sounds/uliuliuli/3.wav',

  [`performWedgie-1`] = 'sounds/perform-wedgie/1.wav',
  [`performWedgie-2`] = 'sounds/perform-wedgie/2.wav',
  [`performWedgie-3`] = 'sounds/perform-wedgie/3.wav',
  [`performWedgie-4`] = 'sounds/perform-wedgie/4.wav',

  [`performBanzai-1`] = 'sounds/perform-banzai/1.wav',
  [`performBanzai-2`] = 'sounds/perform-banzai/2.wav',
  [`performBanzai-3`] = 'sounds/perform-banzai/3.wav',

  [`banzaiScream-1`] = 'sounds/banzai-scream/1.wav',
  [`banzaiScream-2`] = 'sounds/banzai-scream/2.wav',
  [`banzaiScream-3`] = 'sounds/banzai-scream/3.wav',

  [`laugh-1`] = 'sounds/laugh/1.wav',
  [`laugh-2`] = 'sounds/laugh/2.wav',
  [`laugh-3`] = 'sounds/laugh/3.wav',
  [`laugh-4`] = 'sounds/laugh/4.wav',
  [`laugh-5`] = 'sounds/laugh/5.wav',
  [`laugh-6`] = 'sounds/laugh/6.wav',

  [`arrgh-1`] = 'sounds/arrgh/1.wav',
  [`arrgh-2`] = 'sounds/arrgh/2.wav',
  [`arrgh-3`] = 'sounds/arrgh/3.wav',
  [`arrgh-4`] = 'sounds/arrgh/4.wav'
}

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
export type AudioBuilder = () => AudioBufferSourceNode
function loadSound(url: string): Promise<AudioBuilder> {
  return fetch(url)
    .then(response => response.arrayBuffer())
    .then(buffer => audioCtx.decodeAudioData(buffer))
    .then(audioBuffer => {
      return () => {
        const source = audioCtx.createBufferSource()
        source.buffer = audioBuffer
        source.connect(audioCtx.destination)
        return source
      }
    })
}

function load(key: string, url: string): Promise<any> {
  const isImage = url.endsWith('gif') || url.endsWith('png') || url.endsWith('bmp')
  const isSound = url.endsWith('wav') || url.endsWith('mp3')
  const loader = isImage ? loadImage : isSound ? loadSound : null
  if (loader) {
    // @ts-ignore
    return loader(url).then((resource: any) => assets.set(key, resource))
  }

  return Promise.reject(`unsupported resource type ${url}`)
}

function preload(onAssetReady: (ready: number, expected: number) => void) {
  let ready = 0, expected = Object.entries(Asset).length
  const promises = Object.entries(Asset)
    .map(([key, url]) => load(key, url).then(() => onAssetReady(++ready, expected)))
  onAssetReady(ready, expected)
  return Promise.all(promises)
}

function getAsset<T extends HTMLImageElement | AudioBuilder>(asset: AssetKey): T {
  const r = assets.get(asset)
  if (r === undefined) throw new Error(`asset ${asset} is not available`)
  else return r as T
}
// @ts-ignore
window.getAsset = getAsset

export { preload, getAsset, AssetKey }
