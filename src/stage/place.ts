import type { AreaName } from '../worlds/types'

/**
 * Where the current issue's chapter objects stand, and the ground height under them once the region's
 * paper has been laid. Written by the issue page and by the paper land; read every frame by the stage.
 */
export const place = {
  focus: null as { lon: number; lat: number } | null,
  area: null as AreaName | null,
  gong: 'flat' as 'flat' | 'bossed',
  /** area → ground height (world units) at the focus, filled in when that area is built */
  ground: {} as Partial<Record<AreaName, number>>,
  /** area → height of the middle of its stack (a resting height for the camera target) */
  rest: {} as Partial<Record<AreaName, number>>,
}
