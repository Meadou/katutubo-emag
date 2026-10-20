import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import type { Group } from '../../content'
import { OBJECTS } from '../objects/registry'
import { scrollState, useMag } from '../../store'
import { createWeaveMaterial } from '../shaders/WeavePattern'

/** Each chapter object scales in when its chapter is on screen and out when it leaves. */
function Slot({ name, active, color }: { name: string; active: boolean; color: string }) {
  const ref = useRef<THREE.Group>(null!)
  const Comp = OBJECTS[name] ?? OBJECTS.spirits
  useFrame((_, dt) => {
    const s = THREE.MathUtils.damp(ref.current.scale.x, active ? 1 : 0.0001, 4, dt)
    ref.current.scale.setScalar(s)
    ref.current.visible = s > 0.01
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, active ? 0 : -1.2, 3, dt)
  })
  return (
    <group ref={ref} scale={0.0001}>
      <Comp color={color} />
    </group>
  )
}

export default function GroupScene({ group }: { group: Group }) {
  const chapter = useMag((s) => s.chapter)
  const { viewport, size } = useThree()
  const holder = useRef<THREE.Group>(null!)
  const ring = useRef<THREE.Mesh>(null!)
  const halo = useMemo(() => createWeaveMaterial(group.color, { wave: 0, brightness: 0.35 }), [group.color])
  const keys = useMemo(() => [...new Set(group.chapters.map((c) => c.object))], [group])
  const activeKey = group.chapters[chapter]?.object ?? keys[0]
  const wide = size.width > 900

  useFrame(({ clock, pointer }, dt) => {
    halo.uniforms.uTime.value = clock.elapsedTime
    const h = holder.current
    // object sits to the right of the text column on desktop, above it on mobile
    const tx = wide ? viewport.width * 0.22 : 0
    const ty = wide ? 0 : viewport.height * 0.18
    h.position.x = THREE.MathUtils.damp(h.position.x, tx, 3, dt)
    h.position.y = THREE.MathUtils.damp(h.position.y, ty, 3, dt)
    h.rotation.y = THREE.MathUtils.damp(h.rotation.y, pointer.x * 0.35 + scrollState.progress * Math.PI * 0.6, 2.5, dt)
    h.rotation.x = THREE.MathUtils.damp(h.rotation.x, -pointer.y * 0.15, 2.5, dt)
    h.scale.setScalar(wide ? 1 : 0.62)
    // halo sits behind the object (parallax-scaled for its depth), slowly turning
    ring.current.position.x = h.position.x * 2.6
    ring.current.position.y = h.position.y * 2.6
    ring.current.rotation.z = 0.2 + clock.elapsedTime * 0.03
  })

  return (
    <group>
      <group ref={holder}>
        {keys.map((k) => <Slot key={k} name={k} active={k === activeKey} color={group.color} />)}
      </group>
      {/* woven halo far behind, like a cloth hung in the dark */}
      <mesh ref={ring} position={[0, 0, -10]} rotation-z={0.2} material={halo}>
        <ringGeometry args={[4.2, 4.8, 128, 4]} />
      </mesh>
      <Sparkles count={120} scale={[14, 9, 6]} size={2.2} speed={0.25} color={group.color} opacity={0.6} />
    </group>
  )
}
