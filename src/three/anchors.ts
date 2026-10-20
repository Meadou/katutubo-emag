/**
 * Plain data shared by the 3D scene and the DOM, kept free of three.js so the page bundle can
 * import it without pulling in the lazily loaded stage.
 */

/** Screen positions of named 3D points, written every frame by <Anchor> and read by the map labels. */
export interface AnchorPos { x: number; y: number; on: boolean }
export const anchors = new Map<string, AnchorPos>()
