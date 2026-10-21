/**
 * Where each label's anchor is on screen this frame (in CSS pixels), written by the 3D stage and read
 * by the label overlay. `on` is false when the anchor is behind the camera or off screen.
 */
export const spots: { items: { key: string; x: number; y: number; on: boolean }[] } = { items: [] }
