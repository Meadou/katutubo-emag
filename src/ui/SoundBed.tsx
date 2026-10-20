import { useEffect } from 'react'
import { onFrame, journey } from '../worlds/engine'
import { setAmbience } from '../audio/synth'
import { useUi } from './store'

/** Peoples of the water: Lake Lanao (Maranao), Lake Sebu (T'boli), and the seas of Tawi-Tawi (Sama Dilaut). */
const WATER = new Set(['maranao', 'tboli', 'samadilaut'])

/** Wind and water for where the journey is, while the reader has sound on. Renders nothing. */
export default function SoundBed() {
  useEffect(() => {
    let last = '', wait = 0
    return onFrame((dt) => {
      wait -= dt
      const w = journey.current
      if (!w || wait > 0 || !useUi.getState().sound) return
      wait = 0.25
      const map = w.camera.dist > 3.2 || !w.people
      const water = WATER.has(w.people ?? '')
      let wind = map ? 0.4 : water ? 0.25 : 0.75
      let waves = map ? 0.35 : water ? 0.8 : 0.1
      // a still chapter is quieter still
      if (w.still) { wind *= 0.5; waves *= 0.5 }
      const key = `${wind.toFixed(2)}:${waves.toFixed(2)}`
      if (key !== last) { last = key; setAmbience(wind, waves) }
    })
  }, [])
  return null
}
