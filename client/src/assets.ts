import { preload as untypedPreload, getAsset as getUntypedAssets, AudioBuilder } from 'tiny-game-engine/lib/index'
import { AssetKey } from "../../types/types"

enum Assets {
  grass = "img/floors/grass-huge.png",
  grassHuge2 = "img/floors/grass2-huge.png",
  largeMarble = "img/floors/largemarble-huge.png",
  largeConcrete = "img/floors/concrete-large.png",
  largeTile = "img/floors/tile-large.png",
  walls = "img/walls/walls.png",
  blood = "img/players/blood/blood.png",
  
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
  
  [`pill-red`] = "img/decorations/pilleri punainen.png",
  [`pill-green`] = "img/decorations/pilleri vihreä.png",
  [`pill-blue`] = "img/decorations/pilleri sininen.png",
  lightCone = "img/lights/conelight_1.png",
  
  biliardTable = 'img/decorations/biljardipöytä.png',
  chair = 'img/decorations/tuoli2.png',
  chair2 = 'img/decorations/tuoli1.png',
  toilet = 'img/decorations/pytty.png',
  sink = 'img/decorations/pesulaari.png',
  cauch = 'img/decorations/sohva.png',
  table = 'img/decorations/pöytä2.png',
  table2 = 'img/decorations/pöytä1.png',
  table3 = 'img/decorations/pöytä3.png',
  car1 = 'img/decorations/auto1.png',
  car2 = 'img/decorations/auto2.png',
  tree1 = 'img/decorations/puu2.png',
  tree2 = 'img/decorations/puu1.png',

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

function preload(onAssetReady: (ready: number, expected: number) => void) {
  return untypedPreload(Assets, onAssetReady)
}

function getAsset<T extends HTMLImageElement | AudioBuilder>(asset: AssetKey): T {
  return getUntypedAssets(asset)
}

export { preload, getAsset, AssetKey }
