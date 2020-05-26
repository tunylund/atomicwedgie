import { Map, Pill, AssetKey, Player, EffectType } from '../../types/types'
import { getSpawnPoint } from './maps'
import { randomFrom } from './utils'
import { v4 as uuid } from 'uuid'
import { position, xyz, XYZ, zero, intersects } from 'tiny-game-engine'

export function tryToCreatePill(pills: Pill[], map: Map) {
  const maxPills = Math.ceil(map.tiles[0].length * map.tiles[0][0].length / (map.tileSize))
  if(pills.length < maxPills && Math.random() < 0.25) {
    return [buildPill(getSpawnPoint(map))]
  } else {
    return []
  }
}

export function tryToConsumePills(player: Player, pills: Pill[]): Pill[] {
  const consumed: string[] = []
  pills
    .filter(pill => intersects(player, pill))
    .map(pill => {
      player.effects.push({
        id: pill.id,
        type: pill.type,
        duration: pill.effectDuration
      })
      consumed.push(pill.id)
    })
  return pills.filter(pill => !consumed.includes(pill.id))
}

function buildPill({x, y}: XYZ): Pill {
  const type = randomFrom([EffectType.Red, EffectType.Green, EffectType.Blue])
  return {
    id: uuid(),
    asset: `pill-${type}` as AssetKey,
    effectDuration: 8,
    type,
    pos: position(x, y),
    dim: xyz(16, 16, 32),
    dir: zero
  }
}
