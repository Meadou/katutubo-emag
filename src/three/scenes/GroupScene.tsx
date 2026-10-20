import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { sceneObjectKeys, type Group } from '../../content'
import { OBJECTS } from '../objects/registry'
import DotGrid from '../DotGrid'
import Anchor from '../Anchor'
import { TERM_ANCHORS } from '../anchors'
import { scrollState, useMag } from '../../store'

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
  const origin = useMemo(() => new THREE.Vector3(), [])
  const holder = useRef<THREE.Group>(null!)
  const keys = useMemo(() => sceneObjectKeys(group), [group])
  const activeKey = group.chapters[chapter]?.object ?? keys[0]
  const wide = size.width > 900

  useFrame(({ pointer, camera }, dt) => {
    const h = holder.current
    // measured at the live camera: the size captured at mount still belongs to the cover's far camera
    const vp = viewport.getCurrentViewport(camera, origin)
    // object sits to the right of the text column on desktop, above it on mobile
    const tx = wide ? vp.width * 0.21 : 0
    const ty = wide ? -0.1 : vp.height * 0.24
    h.position.x = THREE.MathUtils.damp(h.position.x, tx, 3, dt)
    h.position.y = THREE.MathUtils.damp(h.position.y, ty, 3, dt)
    h.rotation.y = THREE.MathUtils.damp(h.rotation.y, -0.5 + pointer.x * 0.3 + scrollState.progress * Math.PI * 0.5, 2.5, dt)
    h.rotation.x = THREE.MathUtils.damp(h.rotation.x, 0.18 - pointer.y * 0.12, 2.5, dt)
    h.scale.setScalar(wide ? 0.72 : 0.4)
  })

  return (
    <group>
      <group ref={holder}>
        {keys.map((k) => <Slot key={k} name={k} active={k === activeKey} color={group.color} />)}
        {TERM_ANCHORS.map((p, i) => <Anchor key={i} id={`term:${i}`} position={p} />)}
      </group>
      <DotGrid size={30} step={0.5} y={-2.2} />
    </group>
  )
}
