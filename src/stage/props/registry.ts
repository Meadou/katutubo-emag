import type { ComponentType } from 'react'
import Terraces from './Terraces'
import { GongStand, LoomFrame } from './StandIns'

/** What every prop receives: the accent of the world it stands in. */
export interface PropProps { accent: string }

/** Beliefs, rituals and spirits are given stillness, not an object: this key draws nothing. */
const Stillness: ComponentType<PropProps> = () => null

/**
 * Object keys used by the `objects:` line in each article's frontmatter (one per chapter). Terraces is
 * the one high-quality hero; the others are procedural paper stand-ins, all of them still.
 *
 * To add an img2threejs model, save its factory (returns THREE.Group) beside these props and register
 * it with `fromFactory(createModel)` from ./fromFactory.
 */
export const OBJECTS: Record<string, ComponentType<PropProps>> = {
  terraces: Terraces,
  gong: GongStand,
  loom: LoomFrame,
  spirits: Stillness,
}

/** Keys that draw nothing, so worlds that show them are still by construction. */
export const STILL_KEYS = new Set(['spirits'])
