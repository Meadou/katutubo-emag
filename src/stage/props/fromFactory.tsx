import { useMemo, type ComponentType } from 'react'
import type * as THREE from 'three'

/**
 * Wraps a factory that returns a THREE object (e.g. an img2threejs output) as a scene component.
 * The factory runs once per mount; `color` is ignored because such models carry their own materials.
 */
export function fromFactory(factory: () => THREE.Object3D): ComponentType<{ color: string }> {
  return function FactoryObject() {
    const object = useMemo(factory, [])
    return <primitive object={object} />
  }
}
