import { describe, expect, it, vi } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import * as THREE from 'three'
import { fromFactory } from './fromFactory'

describe('fromFactory', () => {
  it('renders the factory output once per mount', async () => {
    const factory = vi.fn(() => { const g = new THREE.Group(); g.name = 'bulul'; return g })
    const Obj = fromFactory(factory)
    const r = await ReactThreeTestRenderer.create(<Obj color="#fff" />)
    await r.update(<Obj color="#000" />)
    expect(factory).toHaveBeenCalledTimes(1)
    expect(r.scene.findAll((n) => n.instance.name === 'bulul')).toHaveLength(1)
  })
})
