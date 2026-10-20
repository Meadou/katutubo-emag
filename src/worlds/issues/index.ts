import type { AreaName } from '../types'

/** A camera framing relative to an issue's focus point. Distances are in degrees of map. */
export interface Shot { dist: number; tilt: number; yaw: number; dlon?: number; dlat?: number }

/** The live demo paired with a chapter (the anime.js pattern: short text, something to try beside it). */
export type DemoSpec =
  | { kind: 'region' }
  | { kind: 'story'; scene: 'flood' | 'abaca' }
  | { kind: 'gongs'; gong: 'flat' | 'bossed' }
  | { kind: 'terms' }
  | { kind: 'weave'; structure: 'plain' | 'twill'; colors: string[] }

/**
 * Per-people design: which place's finer paper the zoom lands in, where the camera comes to rest,
 * how the stop and each chapter are framed, and which demo each chapter pairs with. Design data
 * only: every fact stays in the article Markdown.
 */
export interface IssueDesign {
  area: AreaName
  /** where the camera comes to rest in the place; the chapter objects stand here */
  focus: { lon: number; lat: number }
  /** framings: `stop` for the people's own card, then by chapter id, and `sources` */
  shots: Record<string, Shot>
  /** demos by chapter id */
  demos: Record<string, DemoSpec>
}

import { ifugao } from './ifugao'
import { tboli } from './tboli'

/** A people whose issue is still being prepared: the zoom to their land, and nothing invented there. */
const soon = (area: AreaName, lon: number, lat: number, dist: number, yaw = 0.35): IssueDesign => ({
  area, focus: { lon, lat }, shots: { stop: { dist, tilt: 0.86, yaw } }, demos: {},
})

export const DESIGNS: Record<string, IssueDesign> = {
  kalinga: soon('kalinga', 121.3, 17.38, 0.6, 0.5),
  ifugao,
  bugkalot: soon('caraballo', 121.35, 16.15, 0.7, -0.4),
  suludnon: soon('panay', 122.4, 11.25, 0.62, 0.6),
  ati: soon('panay', 122.2, 11.2, 0.62, -0.5),
  magahat: soon('negros', 122.95, 9.4, 0.62, 0.3),
  maranao: soon('lanao', 124.2, 7.9, 0.66, 0.2),
  tboli,
  samadilaut: soon('tawitawi', 120.05, 5.15, 0.7, -0.3),
}
