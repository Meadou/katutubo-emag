import { useEffect } from 'react'
import { onFrame, journey } from '../worlds/engine'
import { setAmbience } from '../audio/synth'
import { useUi } from './store'
import type { AreaName } from '../worlds/types'

/** Places by the water: Lake Lanao, Lake Sebu, and the seas of Tawi-Tawi. */
const WATER = new Set<AreaName>(['lanao', 'lakesebu', 'tawitawi'])

/** Wind and water for where the journey is, while the reader has sound on. Renders nothing. */
export default function SoundBed() {
  useEffect(() => {
    let last = '', wait = 0
    return onFrame((dt) => {
      wait -= dt
      const w = journey.current
      if (!w || wait > 0 || !useUi.getState().sound) return
      wait = 0.25
      const map = w.camera.dist > 2.2 || w.area === 'archipelago'
      let wind = map ? 0.4 : WATER.has(w.area) ? 0.25 : 0.75
      let water = map ? 0.35 : WATER.has(w.area) ? 0.8 : 0.1
      // a still chapter is quieter still
      if (w.still) { wind *= 0.5; water *= 0.5 }
      const key = `${wind.toFixed(2)}:${water.toFixed(2)}`
      if (key !== last) { last = key; setAmbience(wind, water) }
    })
  }, [])
  return null
}
