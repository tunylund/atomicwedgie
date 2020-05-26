import { AssetKey, Modes, Player } from "../../types/types"
import { getFlags } from "./players"
import { getAsset, AudioBuilder } from "./assets"
import { distance } from "tiny-game-engine/lib/index"

const r = (max: number) => Math.ceil(Math.random()*max)
const sound = (key: string) => getAsset<AudioBuilder>(key as AssetKey)()

const insult = () => sound(`laugh-${r(6)}`).start()
const walk = () => sound(`walk-${r(3)}`).start()
const wedgie = () => sound(`performWedgie-${r(4)}`).start()
const banzai = () => {
  const s = sound(`performBanzai-${r(3)}`)
  s.start(s.context.currentTime + 0.4)
}
const clubsOut = () => sound(`banzaiScream-${r(3)}`).start()
const wedgied = () => sound(`arrgh-${r(4)}`).start()
const banzaid = () => sound(`arrgh-${r(4)}`).start()
const uliuli = () => sound(`uliuliuli`).start()
const nomnom = () => sound(`pill-${r(3)}`).start()

const modes = new Map<string, Modes>()
export function playMode(player: Player, myId: string) {
  if (modes.get(player.id) !== player.mode) {
    const { isAttacking, isInBanzai, isMoving, isDead, isDeadByBanzai, isDeadByWedgie } = getFlags(player)
    const previousMode = modes.get(player.id)
    modes.set(player.id, player.mode)
    const wasInBanzai = previousMode && [Modes.BanzaiAttack, Modes.BanzaiStand, Modes.BanzaiWalk].includes(previousMode)

    if (!wasInBanzai && isInBanzai) clubsOut() 
    if (isAttacking && isInBanzai) banzai()
    if (isAttacking && !isInBanzai) wedgie()
    if (isDeadByBanzai) banzaid()
    if (isDeadByWedgie) wedgied()
    if (player.id === myId && isDead) insult()
  }
}

const valves = new Map<string, boolean>()
function releaseValve(id: string, fn: any) {
  return () => {
    if (!valves.has(id) || valves.get(id)) {
      valves.set(id, false)
      fn()
      setTimeout(() => valves.set(id, true), 300)
    }
  }
}

export function playSteps(protagonist: Player, players: Player[]) {
  if (protagonist.pos.vel.size > 0) releaseValve(protagonist.id, walk)()
  players.filter(p => p.id !== protagonist.id).map(player => {
    if (player.pos.vel.size > 0) {
      const d = distance(player, protagonist)
      if (d < 200) releaseValve(player.id, walk)()
    }
  })
}
