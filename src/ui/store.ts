import { create } from 'zustand'
import { startAmbience, stopAmbience } from '../audio/synth'

const KEY = 'katutubo:sound'
const remembered = () => { try { return localStorage.getItem(KEY) === 'on' } catch { return false } }
const remember = (on: boolean) => { try { localStorage.setItem(KEY, on ? 'on' : 'off') } catch { /* private window: forget */ } }

interface Ui {
  /** which people's pin is being pointed at on the map */
  hovered: string | null
  setHovered: (s: string | null) => void
  /** the reader asked for sound; it starts only from their tap */
  sound: boolean
  /** whether a sound preference from an earlier visit is waiting for a first tap */
  soundWanted: boolean
  setSound: (on: boolean) => void
}

export const useUi = create<Ui>((set) => ({
  hovered: null,
  setHovered: (hovered) => set({ hovered }),
  sound: false,
  soundWanted: remembered(),
  // call from a click or key handler: that is the only moment browsers let sound begin
  setSound: (on) => {
    if (on) startAmbience()
    else stopAmbience()
    remember(on)
    set({ sound: on, soundWanted: on })
  },
}))
