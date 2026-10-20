import { en } from './en'

/** The active dictionary (one language for now; a language switch will choose between files). */
export const strings = en

/** Fills `{name}` placeholders in a string. */
export function fill(s: string, vars: Record<string, string | number> = {}) {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`))
}

/** Map coordinates as printed on a survey: 16.85°N 121.10°E. */
export const coords = (p: { lat: number; lon: number }) =>
  `${Math.abs(p.lat).toFixed(2)}°${p.lat >= 0 ? 'N' : 'S'} ${Math.abs(p.lon).toFixed(2)}°${p.lon >= 0 ? 'E' : 'W'}`
