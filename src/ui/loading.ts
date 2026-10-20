import { create } from 'zustand'

/** What the first screen waits for: the fonts, the map, and in 3D the stage laid out and its shaders compiled. */
interface Loading {
  fonts: boolean
  map: boolean
  stage: boolean
  /** map sheets built so far, of how many */
  built: number
  total: number
  compiled: boolean
  mark: (p: Partial<Omit<Loading, 'mark'>>) => void
}

export const useLoading = create<Loading>((set) => ({
  fonts: false, map: false, stage: false, built: 0, total: 0, compiled: false,
  mark: (p) => set(p),
}))

type State = Omit<Loading, 'mark'>

/** 0..1, for the progress bar. The flat map needs only the fonts and the data. */
export function progressOf(s: State, live: boolean): number {
  if (!live) return (Number(s.fonts) + Number(s.map)) / 2
  const sheets = s.total ? s.built / s.total : 0
  return 0.1 * Number(s.fonts) + 0.2 * Number(s.map) + 0.1 * Number(s.stage) + 0.5 * sheets + 0.1 * Number(s.compiled)
}

export function isReady(s: State, live: boolean): boolean {
  return s.fonts && s.map && (!live || (s.stage && s.total > 0 && s.built >= s.total && s.compiled))
}
