import { mixColor } from '../worlds/blend'
import type { MapBlend } from '../worlds/types'

/**
 * How the map is printed and how its Davao pieces move. Shared by the 3D stage, the ground lookups
 * and the flat fallback, so a pin, a label and the paper always agree on where a piece is.
 */

/** Unprinted paper: the colour the rest of the country fades toward when the Davao Region is the subject. */
export const PAPER = '#efe5d2'

/** Where the Davao pieces part from: the middle of the Davao Gulf. */
export const GULF = { lon: 125.72, lat: 6.82 }

/**
 * Each piece's own paper, from the coast up. Colours of the land, not of any people's designs: leaf,
 * gold, sea, coral, plum, and a warm clay for the city.
 */
export const PIECE_COLORS: Record<string, string> = {
  'davao-del-norte': '#5f8f5a',
  'davao-de-oro': '#cf9a36',
  'davao-oriental': '#3d8781',
  'davao-occidental': '#d4735a',
  'davao-del-sur': '#86689c',
  'davao-city': '#b08a68',
}

/**
 * The other regions alternate between four paper tones (no two neighbours alike), so even pale they
 * read as separate pieces. Multipliers on the sheet colour: plain, cool, warm, grey.
 */
const TONES: [number, number, number][] = [[1, 1, 1], [0.93, 0.955, 0.985], [0.99, 0.95, 0.89], [0.925, 0.925, 0.93]]
const REGION_TONE: Record<string, number> = {
  'Ilocos Region': 0, CAR: 1, 'Cagayan Valley': 2, 'Central Luzon': 3, NCR: 0, Calabarzon: 1, Mimaropa: 2,
  'Bicol Region': 0, 'Western Visayas': 0, 'Central Visayas': 1, 'Eastern Visayas': 2,
  'Zamboanga Peninsula': 0, 'Northern Mindanao': 1, Caraga: 2, ARMM: 2, Soccsksargen: 0, 'Davao Region': 3,
}
export const toneOf = (region: string | undefined): [number, number, number] => TONES[REGION_TONE[region ?? ''] ?? 0]

/** How high the piece in focus stands above the others, and how much farther it parts. */
const FOCUS_LIFT = 0.04
const FOCUS_PART = 0.6

/** Where a Davao piece is laid in a world: its offset from rest, in world units (x east, y up, z south). */
export function pieceOffset(p: { key: string; lon: number; lat: number }, m: MapBlend) {
  const f = m.focus[p.key] ?? 0
  const dx = p.lon - GULF.lon, dz = -(p.lat - GULF.lat)
  const len = Math.hypot(dx, dz) || 1
  const part = m.part * (1 + FOCUS_PART * f)
  return { x: (dx / len) * part, y: m.rise + FOCUS_LIFT * f, z: (dz / len) * part }
}

/** How much a piece is set back when another one is in focus (0 when none is). */
export function setBack(key: string, m: MapBlend) {
  let any = 0
  for (const v of Object.values(m.focus)) any = Math.max(any, v)
  return Math.max(0, any - (m.focus[key] ?? 0))
}

/** The colour of a Davao piece's sheet: its own paper, shaded by height, under the world's light. */
export function pieceColor(key: string, worldColor: string, shade: number, m: MapBlend) {
  const own = PIECE_COLORS[key] ?? '#a08a70'
  // darker at the coast, lighter toward the summits, like stacked card of one colour
  const card = shade < 0.5 ? mixColor(own, '#1d1b17', (0.5 - shade) * 0.32) : mixColor(own, '#fff3dc', (shade - 0.5) * 0.7)
  const c = mixColor(worldColor, card, m.tint)
  return mixColor(c, PAPER, setBack(key, m) * 0.5)
}

/** The colour of the rest of the country's sheet: the world's own paper, faded toward unprinted paper. */
export const restColor = (worldColor: string, m: MapBlend) => mixColor(worldColor, PAPER, m.dim)
