/**
 * Plain data shared by the 3D scene and the DOM, kept free of three.js so the page bundle can
 * import it without pulling in the lazily loaded stage.
 */

/** Screen positions of named 3D points, written every frame by <Anchor> and read by the callout layer. */
export interface AnchorPos { x: number; y: number; on: boolean }
export const anchors = new Map<string, AnchorPos>()

/** Points around an issue's object where its chapter's key terms are pinned (holder space). */
export const TERM_ANCHORS: [number, number, number][] = [
  [-1.25, 1.35, 0.3], [1.35, 1.1, 0.1], [1.55, -0.2, 0.4], [-1.45, -0.55, 0.2], [0.35, 1.85, -0.1], [0.4, -1.45, 0.5],
]
