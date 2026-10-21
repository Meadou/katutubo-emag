/** Bounds of the baked paper map, in degrees (must match the bake script). */
export const MAP = { west: 116.5, east: 127.0, south: 4.6, north: 20.8 }

/** Where the camera looks: a point on the land, how far away, how steeply it looks down, and from which side. */
export interface Camera {
  lon: number
  lat: number
  /** distance in degrees of the map (1 world unit = 1 degree) */
  dist: number
  /** radians from straight down (0) toward the horizon */
  tilt: number
  /** radians around the target; 0 looks north */
  yaw: number
}

/**
 * Everything one world is: its sky and light, the colours of its paper, where the camera is on the
 * one paper map, and whether it moves at all. A section holds one world while its text scrolls.
 */
export interface WorldState {
  /** sky gradient, top then horizon */
  sky: [string, string]
  sun: { color: string; intensity: number; azimuth: number; elevation: number }
  /** soft fill light, 0..1 */
  ambient: number
  /** paper colours from the shore up to the summits; any length of 2 or more */
  land: string[]
  /** deep then shallow water */
  sea: [string, string]
  /** the cut edge of each sheet */
  edge: string
  accent: string
  camera: Camera
  /** sacred chapters are still: no camera drift, nothing moving */
  still: boolean
  /** chapter objects standing in this world (keys of the props registry) */
  props: string[]
  /** where the objects stand */
  site?: { lon: number; lat: number }
  /** the people this world belongs to (slug), if any */
  people?: string
  /** a people's place marked on the map */
  pin?: { lon: number; lat: number }
  /** words attached to the visual by a thin leader line: at a place on the map, or on the chapter's object */
  labels?: Label[]
  /**
   * A travel world is a journey, not a place: across its section the camera zooms from one world to
   * another along one smooth path. The other fields are ignored while it travels.
   */
  travel?: { from: string; to: string }
}

/**
 * A label on the visual. A place label names a people at their place (and may link there); an object
 * label stands on the chapter's object, which then carries its own controls (the gongs to play).
 */
export interface Label {
  key: string
  lon: number
  lat: number
  /** height above the ground of the point the line touches (an object's top) */
  up?: number
  text: string
  sub?: string
  href?: string
  object?: string
}

/** A world mixed between two neighbours, as the engine and the renderers use it. */
export interface Blended extends WorldState {
  /** how present each prop is */
  propWeights: Record<string, number>
  /** 0 when still, 1 when the camera may drift with the pointer */
  drift: number
}
