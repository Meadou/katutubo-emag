import type { AreaName } from '../types'

/** A camera framing relative to an issue's focus point. Distances are in degrees of map. */
export interface Shot { dist: number; tilt: number; yaw: number; dlon?: number; dlat?: number }

/** The live demo paired with a chapter (the anime.js pattern: short text, something to try beside it). */
export type DemoSpec =
  | { kind: 'region' }
  | { kind: 'story'; scene: 'flood' | 'abaca' }
  | { kind: 'syllables' }
  | { kind: 'gongs'; gong: 'flat' | 'bossed' }
  | { kind: 'pluck'; strings: number }
  | { kind: 'terms' }
  | { kind: 'weave'; structure: 'plain' | 'twill'; colors: string[] }

/**
 * Per-issue design: which paper area the fly-in lands in, where the camera comes to rest, how each
 * chapter is framed, and which demo it pairs with. Design data only: every fact stays in the
 * article Markdown.
 */
export interface IssueDesign {
  area: AreaName
  /** where the camera comes to rest in the region; the chapter objects stand here */
  focus: { lon: number; lat: number }
  /** framings by chapter id, plus `sources` for the high view at the end */
  shots: Record<string, Shot>
  /** demos by chapter id */
  demos: Record<string, DemoSpec>
}

import { ifugao } from './ifugao'
import { mangyan } from './mangyan'
import { tboli } from './tboli'

export const DESIGNS: Record<string, IssueDesign> = { ifugao, mangyan, tboli }
