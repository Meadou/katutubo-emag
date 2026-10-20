import type { ComponentType } from 'react'
import GongSet from './GongSet'
import RiceTerraces from './RiceTerraces'
import Loom from './Loom'
import Bamboo from './Bamboo'
import Spirits from './Spirits'

/**
 * Object keys used by the `objects:` line in each article's frontmatter.
 *
 * To add an img2threejs model: save its factory (returns THREE.Group) here, e.g. `bulul.ts`,
 * then register it below with one line:
 *
 *   import { createBulul } from './bulul'
 *   bulul: fromFactory(createBulul),
 *
 * (fromFactory lives in ./fromFactory). Any article can then use `objects: bulul, ...`.
 */
export const OBJECTS: Record<string, ComponentType<{ color: string }>> = {
  gong: GongSet,
  terraces: RiceTerraces,
  loom: Loom,
  bamboo: Bamboo,
  spirits: Spirits,
}
