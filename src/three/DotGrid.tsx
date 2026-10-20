import { useMemo } from 'react'
import * as THREE from 'three'
import { inkMaterials } from './ink'

/** A faint dot grid on the ground plane, fading out from the centre: the drafting table. */
export default function DotGrid({ size = 40, step = 0.5, y = 0 }: { size?: number; step?: number; y?: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        // shares the ink's colour object, so the grid recolours with the page tone
        uniforms: { uColor: { value: inkMaterials.soft.color }, uStep: { value: step }, uSize: { value: size } },
        vertexShader: /* glsl */ `
          varying vec2 vP;
          void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform float uStep; uniform float uSize; varying vec2 vP;
          void main() {
            vec2 g = abs(fract(vP / uStep + 0.5) - 0.5) * uStep;
            float d = length(g);
            float w = fwidth(d);
            float dot = 1.0 - smoothstep(0.018 - w, 0.018 + w, d);
            float fade = 1.0 - smoothstep(uSize * 0.18, uSize * 0.45, length(vP));
            gl_FragColor = vec4(uColor, dot * fade * 0.7);
          }`,
      }),
    [size, step],
  )
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={y} material={material}>
      <planeGeometry args={[size, size]} />
    </mesh>
  )
}
