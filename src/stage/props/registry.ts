import type { ComponentType } from 'react'

/** What every prop receives: the accent of the world it stands in. */
export interface PropProps { accent: string }

const pending: ComponentType<PropProps> = () => null

/**
 * Object keys used by the `objects:` line in each article's frontmatter (one per chapter).
 * `spirits` deliberately draws nothing: beliefs, rituals and spirits are given stillness, not an object.
 *
 * To add an img2threejs model, save its factory (returns THREE.Group) beside these props and register
 * it with `fromFactory(createModel)` from ./fromFactory.
 */
export const OBJECTS: Record<string, ComponentType<PropProps>> = {
  terraces: pending,
  gong: pending,
  bamboo: pending,
  loom: pending,
  spirits: pending,
}
