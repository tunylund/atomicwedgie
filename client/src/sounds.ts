import { AssetKey, Modes, Player, EffectType } from "../../types/types"
import { getFlags } from "./players"
import { getAsset } from "./assets"
import { distance, AudioBuilder } from "tiny-game-engine/lib/index"

const r = (max: number) => Math.ceil(Math.random()*max)
const sound = (key: string, volume: number) => getAsset<AudioBuilder>(key as AssetKey)(volume)

let volume = 0.2
const insult = releaseValve('insult', () => sound(`laugh-${r(6)}`, volume * 0.5).start())
const walk = () => sound(`walk-${r(3)}`, volume).start()
const wedgie = releaseValve('wedgie', () => sound(`performWedgie-${r(4)}`, volume * 0.5).start())
const banzai = releaseValve('banzai', () => {
  const s = sound(`performBanzai-${r(3)}`, volume * 0.5)
  s.start(s.context.currentTime + 0.4)
})
const clubsOut = releaseValve('clubsOut', () => sound(`banzaiScream-${r(3)}`, volume * 0.5).start())
const wedgied = releaseValve('wedgied', () => sound(`arrgh-${r(4)}`, volume * 0.5).start())
const banzaid = releaseValve('banzaid', () => sound(`arrgh-${r(4)}`, volume * 0.5).start())
const uliuli = releaseValve('uliuli', () => sound(`uliuliuli`, volume * 0.5).start())
const nomnom = releaseValve('nomnom', () => sound(`pill-${r(3)}`, volume * 0.5).start())
const crickets = releaseValve('crickets', () => sound('crickets', volume * 0.5).start(), 60000)

const valves = new Map<string, boolean>()
function releaseValve(id: string, fn: any, timeout = 300) {
  return () => {
    if (!valves.has(id) || valves.get(id)) {
      valves.set(id, false)
      fn()
      setTimeout(() => valves.set(id, true), timeout)
    }
  }
}

const modes = new Map<string, Modes>()
export function playModeChanges(players: Player[], myId: string) {
  players.map(player => {
    if (modes.get(player.id) !== player.mode) {
      const { isAttacking, isInBanzai, isDead, isDeadByBanzai, isDeadByWedgie } = getFlags(player)
      const previousMode = modes.get(player.id)
      modes.set(player.id, player.mode)
      const wasInBanzai = previousMode && [Modes.BanzaiAttack, Modes.BanzaiStand, Modes.BanzaiWalk].includes(previousMode)
  
      if (!wasInBanzai && isInBanzai) clubsOut() 
      if (isAttacking && isInBanzai) releaseValve('any-banzai', banzai, 500)()
      if (isAttacking && !isInBanzai) wedgie()
      if (isDeadByBanzai) banzaid()
      if (isDeadByWedgie) wedgied()
      if (player.id === myId && isDead) insult()
    }
  })
}

let effects: EffectType[] = []
export function playEffects(player: Player) {
  player.effects
    .filter(fx => !effects.includes(fx.type))
    .map(fx => {
      if (fx.type === EffectType.Green) uliuli()
      else nomnom()
    })
  effects = player.effects.map(fx => fx.type)
}

export function playMusic(name: string) {
  if (name === 'crickets') crickets()
}

export function playSteps(protagonist: Player, players: Player[]) {
  if (protagonist.pos.vel.size > 0) releaseValve(protagonist.id, walk)()
  players.filter(p => p.id !== protagonist.id).map(player => {
    if (player.pos.vel.size > 0) {
      const cutoffDistance = 200
      const d = distance(player, protagonist)
      const volumeByDistance = volume * (1 - d / cutoffDistance)
      if (d < cutoffDistance) {
        releaseValve(player.id, () => sound(`walk-${r(3)}`, volumeByDistance).start())()
      }
    }
  })
}
