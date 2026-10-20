/**
 * What a story step puts on the map: plain data (no three.js), written by the story page and drawn by
 * the stage. Positions are longitude/latitude so figures stand on the real terrain.
 */
export type PoseName = 'stand' | 'walk' | 'strike' | 'pluck' | 'harp' | 'kneel' | 'raise' | 'sit' | 'listen'
export type InstrumentKind = 'kuglung' | 'saluray' | 'agung' | 'kubing'

export interface FigureSpec {
  /** stable id: the same id in the next step walks from here to its new place */
  id: string
  lon: number
  lat: number
  pose: PoseName
  facing?: number
  wrap?: boolean
  mallet?: boolean
  /** plays this instrument when the visitor sounds it */
  plays?: InstrumentKind
  /** relative size, e.g. 0.72 for a child */
  size?: number
}

export interface InstrumentSpec { kind: InstrumentKind; lon: number; lat: number; facing?: number }

export interface StageSpec {
  figures: FigureSpec[]
  instruments: InstrumentSpec[]
  /** a sacred presence is shown only as light, never as a figure */
  light?: { lon: number; lat: number; rise?: boolean }
  /** short words floating slowly around the scene */
  cards: string[]
  /** where the cards orbit */
  center: { lon: number; lat: number }
}
