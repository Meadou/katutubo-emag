/** A camera framing relative to an issue's focus point. Distances are in degrees of map. */
export interface Shot { dist: number; tilt: number; yaw: number; dlon?: number; dlat?: number }

/** The live demo paired with a chapter (the anime.js pattern: short text, something to try beside it). */
export type DemoSpec =
  | { kind: 'story'; scene: 'flood' | 'abaca' }
  | { kind: 'gongs'; gong: 'flat' | 'bossed' }
  | { kind: 'weave'; structure: 'plain' | 'twill'; colors: string[] }

/**
 * Per-people design: where on the map the camera comes down, how the stop and each chapter are
 * framed, and which demo each chapter pairs with. Design data only: every fact stays in the article
 * Markdown. The one paper map reads well from a distance of about 1.8 out; closer, it turns to blobs.
 */
export interface IssueDesign {
  /** where the camera comes to rest; the chapter objects stand here */
  focus: { lon: number; lat: number }
  /** framings: `stop` for the people's own card, then by chapter id, and `sources` */
  shots: Record<string, Shot>
  /** demos by chapter id */
  demos: Record<string, DemoSpec>
  /** the label on a chapter's object, by chapter id: a term from that chapter's own text (tested) */
  labels?: Record<string, string>
}

import { ifugao } from './ifugao'
import { tboli } from './tboli'

/** A people whose issue is still being prepared: the zoom to their land, and nothing invented there. */
const soon = (lon: number, lat: number, yaw = 0.35): IssueDesign => ({
  focus: { lon, lat }, shots: { stop: { dist: 2.6, tilt: 0.78, yaw } }, demos: {},
})

export const DESIGNS: Record<string, IssueDesign> = {
  kalinga: soon(121.3, 17.38, 0.5),
  ifugao,
  bugkalot: soon(121.35, 16.15, -0.4),
  suludnon: soon(122.4, 11.25, 0.6),
  ati: soon(122.2, 11.2, -0.5),
  magahat: soon(122.95, 9.4, 0.3),
  maranao: soon(124.25, 7.9, 0.2),
  tboli,
  samadilaut: soon(120.05, 5.15, -0.3),
}
