import type { ComponentType } from 'react'
import { GongStand, LoomFrame } from './StandIns'

/** What every prop receives: the accent of the world it stands in. */
export interface PropProps { accent: string }

/** Beliefs, rituals and spirits are given stillness, not an object: this key draws nothing. */
const Stillness: ComponentType<PropProps> = () => null

/** Not modelled yet: the land itself stands for the terraces on the map. */
const NotYet: ComponentType<PropProps> = () => null

/**
 * Object keys used by the `objects:` line in each article's frontmatter (one per chapter). The gong
 * stand and the loom are simple paper stand-ins, both still; more objects come later.
 *
 * To add an img2threejs model, save its factory (returns THREE.Group) beside these props and register
 * it with `fromFactory(createModel)` from ./fromFactory.
 */
export const OBJECTS: Record<string, ComponentType<PropProps>> = {
  terraces: NotYet,
  gong: GongStand,
  loom: LoomFrame,
  spirits: Stillness,
}

/** Keys that draw nothing, so worlds that show them are still by construction. */
export const STILL_KEYS = new Set(['spirits'])
