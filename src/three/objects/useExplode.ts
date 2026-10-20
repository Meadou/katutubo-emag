import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { frameState, prefersReducedMotion } from '../../store'

/**
 * How far this object has come apart (0..1), damped toward the chapter's scroll progress.
 * Call it before the object's own useFrame so the value is fresh when the object reads it.
 * Under reduced motion objects show already apart, with no travel.
 */
export function useExplode() {
  const e = useMemo(() => ({ current: 0, calm: prefersReducedMotion() }), [])
  useFrame((_, dt) => {
    e.current = e.calm ? 1 : THREE.MathUtils.damp(e.current, frameState.explode, 4, dt)
  })
  return e
}
