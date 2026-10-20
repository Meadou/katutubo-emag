/** The paper areas baked by scripts/worlds/bake.mjs: the whole archipelago, and the finer paper of each place. */
export type AreaName = 'archipelago' | 'kalinga' | 'cordillera' | 'caraballo' | 'panay' | 'negros' | 'lanao' | 'lakesebu' | 'tawitawi'

/** Bounds of each baked area, in degrees (must match the bake script). */
export const AREAS: Record<AreaName, { west: number; east: number; south: number; north: number }> = {
  archipelago: { west: 116.5, east: 127.0, south: 4.6, north: 20.8 },
  kalinga: { west: 120.95, east: 121.6, south: 17.1, north: 17.7 },
  cordillera: { west: 120.75, east: 121.45, south: 16.55, north: 17.25 },
  caraballo: { west: 120.95, east: 121.85, south: 15.8, north: 16.5 },
  panay: { west: 121.9, east: 122.75, south: 10.8, north: 11.6 },
  negros: { west: 122.55, east: 123.35, south: 9.0, north: 9.8 },
  lanao: { west: 123.95, east: 124.6, south: 7.55, north: 8.2 },
  lakesebu: { west: 124.55, east: 124.85, south: 6.06, north: 6.36 },
  tawitawi: { west: 119.6, east: 120.5, south: 4.75, north: 5.55 },
}

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
 * Everything one world is: its sky and light, the colours of its paper, where the camera is, which
 * place's finer paper it wants, and whether it moves at all. A section holds one world while its text scrolls.
 */
export interface WorldState {
  /** sky gradient, top then horizon */
  sky: [string, string]
  sun: { color: string; intensity: number; azimuth: number; elevation: number }
  /** soft fill light, 0..1 */
  ambient: number
  /** paper colours from the shore (or valley floor) up to the summits; any length of 2 or more */
  land: string[]
  /** deep then shallow water */
  sea: [string, string]
  /** the cut edge of each sheet */
  edge: string
  accent: string
  camera: Camera
  /** the place whose finer paper resolves as the camera comes close ('archipelago' for none) */
  area: AreaName
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
  /**
   * A travel world is a journey, not a place: across its section the camera zooms from one world to
   * another along one smooth path. The other fields are ignored while it travels.
   */
  travel?: { from: string; to: string }
}

/** A world mixed between two neighbours, as the engine and the renderers use it. */
export interface Blended extends WorldState {
  /** how present each paper area is: the archipelago always, a place's finer paper as the camera nears it */
  areaWeights: Partial<Record<AreaName, number>>
  /** how present each prop is */
  propWeights: Record<string, number>
  /** 0 when still, 1 when the camera may drift with the pointer */
  drift: number
}
