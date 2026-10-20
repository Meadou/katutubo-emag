import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** A slow vortex of glowing motes — used for chapters about belief, story and the unseen world. */
export default function Spirits({ color }: { color: string }) {
  const ref = useRef<THREE.Points>(null!)
  const count = 1400
  const { geometry, material } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const r = 0.4 + Math.pow(Math.random(), 0.6) * 2.2
      const a = Math.random() * Math.PI * 2
      pos.set([Math.cos(a) * r, (Math.random() - 0.5) * 3.2, Math.sin(a) * r], i * 3)
      seed[i] = Math.random()
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uPx: { value: Math.min(window.devicePixelRatio, 2) } },
      vertexShader: /* glsl */ `
        uniform float uTime; uniform float uPx; attribute float aSeed; varying float vA;
        void main() {
          vec3 p = position;
          float ang = uTime * (0.15 + aSeed * 0.25) / (0.6 + length(p.xz) * 0.4);
          p.xz = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * p.xz;
          p.y += sin(uTime * 0.6 + aSeed * 30.0) * 0.25;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (6.0 + aSeed * 16.0) * uPx / -mv.z;
          vA = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * 2.0 + aSeed * 50.0));
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(mix(uColor, vec3(1.0, 0.95, 0.8), a * 0.5) * 1.6, a * vA);
        }`,
    })
    return { geometry, material }
  }, [color])

  useFrame(({ clock }) => { material.uniforms.uTime.value = clock.elapsedTime })

  return (
    <group>
      <points ref={ref} geometry={geometry} material={material} />
      <mesh>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshBasicMaterial color={new THREE.Color(color).multiplyScalar(2)} toneMapped={false} />
      </mesh>
    </group>
  )
}
