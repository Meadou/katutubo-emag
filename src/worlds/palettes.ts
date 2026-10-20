import type { WorldState } from './types'

/** The light and paper of one time of day: everything in a world except where it is. */
export type Time = Pick<WorldState, 'sky' | 'sun' | 'ambient' | 'land' | 'sea' | 'edge' | 'accent'>

const greens = ['#2f5d46', '#3e6f4d', '#4f7f55', '#6b9460', '#86a66a', '#a9b878', '#cfc98c']

/**
 * Each chapter is a time of day on the same land (see docs/DESIGN_DIRECTION.md). Sun azimuth is in
 * radians from north toward east; elevation in radians above the horizon.
 */
export const TIMES = {
  /** the map: clear midday over a blue paper sea */
  midday: {
    sky: ['#8fc1dc', '#e6efe6'], sun: { color: '#fff6e3', intensity: 2.2, azimuth: 2.4, elevation: 1.05 }, ambient: 0.6,
    land: ['#2f5d46', '#4f7f55', '#86a66a', '#bdbf7c', '#e6d9a8'], sea: ['#1d4c69', '#2f6f8c'], edge: '#f6efe2', accent: '#e2a33a',
  },
  /** the fly-in: the sun just up, clouds lit from below */
  sunrise: {
    sky: ['#f2a995', '#fbe0bf'], sun: { color: '#ffd0a1', intensity: 1.9, azimuth: 1.4, elevation: 0.32 }, ambient: 0.55,
    land: greens, sea: ['#3b5e7c', '#5d86a0'], edge: '#f8e6d2', accent: '#e9875f',
  },
  /** Overview: maize light over terrace greens */
  morning: {
    sky: ['#f2c879', '#fbe9c6'], sun: { color: '#ffe2a8', intensity: 2.1, azimuth: 1.6, elevation: 0.55 }, ambient: 0.58,
    land: greens, sea: ['#2c5a72', '#4c7f92'], edge: '#f6ead0', accent: '#d98a1f',
  },
  /** Myths & Stories: coral sinking into plum */
  dusk: {
    sky: ['#5b3f6e', '#e98b6d'], sun: { color: '#ff9a6b', intensity: 1.9, azimuth: 4.6, elevation: 0.44 }, ambient: 0.72,
    land: ['#4a3d6e', '#5b4a7a', '#6e5784', '#86668b', '#a2778f', '#c38d92'], sea: ['#2c2448', '#3e325f'], edge: '#f0c9b5', accent: '#f08a6a',
  },
  /** Music: deep teal with a brass horizon */
  evening: {
    sky: ['#14353b', '#c98b4a'], sun: { color: '#ffb36b', intensity: 1.8, azimuth: 4.9, elevation: 0.42 }, ambient: 0.72,
    land: ['#2a4a4b', '#345656', '#406360', '#517266', '#68836c', '#859777'], sea: ['#0c2226', '#14353b'], edge: '#d9b98a', accent: '#e2a04f',
  },
  /** Beliefs & Rituals: a still night, with nothing that moves */
  night: {
    sky: ['#101a2c', '#2a3b5a'], sun: { color: '#b9c6e3', intensity: 1.0, azimuth: 3.6, elevation: 0.8 }, ambient: 0.7,
    land: ['#24304c', '#2c3a59', '#364667', '#415375', '#4e6184', '#5e7093'], sea: ['#0b1220', '#121d33'], edge: '#8fa3c4', accent: '#c9d3e6',
  },
  /** Crafts: rose dawn into pale blue */
  dawn: {
    sky: ['#bcd4e6', '#f4b6a6'], sun: { color: '#ffc9b0', intensity: 1.8, azimuth: 1.2, elevation: 0.24 }, ambient: 0.55,
    land: ['#3b4f5c', '#4f6a6c', '#6b8576', '#8ea283', '#b9bf98', '#dcd3b0'], sea: ['#3d5a70', '#5f8197'], edge: '#f6e3da', accent: '#d9786b',
  },
  /** Sources: full day, the land plain to see */
  day: {
    sky: ['#8ec5e8', '#e7f2f2'], sun: { color: '#ffffff', intensity: 2.3, azimuth: 2.1, elevation: 1.15 }, ambient: 0.62,
    land: greens, sea: ['#1f5878', '#3a7d9a'], edge: '#f6efe2', accent: '#2f7d6d',
  },
} satisfies Record<string, Time>

export type TimeName = keyof typeof TIMES

/** Which time of day a chapter takes, by its id (from its title). */
export function timeForChapter(id: string): TimeName {
  if (id === 'overview') return 'morning'
  if (id.startsWith('myths')) return 'dusk'
  if (id === 'music') return 'evening'
  if (id.startsWith('beliefs')) return 'night'
  if (id === 'crafts') return 'dawn'
  return 'day'
}

/** Chapters about beliefs, rituals and spirits are still. */
export const isStillChapter = (id: string) => id.startsWith('beliefs')
