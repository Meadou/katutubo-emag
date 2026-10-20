import type { Group } from './content'

/** Map coordinates as printed on a survey: 16.85°N 121.10°E. */
export const coords = (g: Pick<Group, 'lat' | 'lon'>) =>
  `${Math.abs(g.lat).toFixed(2)}°${g.lat >= 0 ? 'N' : 'S'} ${Math.abs(g.lon).toFixed(2)}°${g.lon >= 0 ? 'E' : 'W'}`
