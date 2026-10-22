/** A camera framing relative to an issue's focus point. Distances are in degrees of map. */
export interface Shot { dist: number; tilt: number; yaw: number; dlon?: number; dlat?: number }

/** The live demo paired with a chapter (the anime.js pattern: short text, something to try beside it). */
export type DemoSpec =
  | { kind: 'story'; scene: 'mountain' | 'sea' | 'sky' | 'river' }
  | { kind: 'gongs'; gong: 'flat' | 'bossed' }
  | { kind: 'lute' }

/**
 * Per-people design: where on the map the camera comes down, how the stop and each chapter are
 * framed, and which demo each chapter pairs with. Design data only: every fact stays in the article
 * Markdown. A people without a design gets framings from the journey (looking out from the gulf).
 */
export interface IssueDesign {
  /** where the camera comes to rest; the chapter objects stand here */
  focus?: { lon: number; lat: number }
  /** framings: `stop` for the people's own card, then by chapter id */
  shots: Record<string, Shot>
  /** demos by chapter id */
  demos: Record<string, DemoSpec>
  /** the label on a chapter's object, by chapter id: a term from that chapter's own text (tested) */
  labels?: Record<string, string>
}

/** Designs by people (slug). The ten issues are still being prepared, so none has demos yet. */
export const DESIGNS: Record<string, IssueDesign> = {}
