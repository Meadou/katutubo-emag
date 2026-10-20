import { use, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { loadHeightfield, toHeight, type AreaName, type Heightfield } from './heightfield'
import { PALETTE } from '../palette'

const low = new THREE.Color(PALETTE.landLow)
const high = new THREE.Color(PALETTE.landHigh)
const sea = new THREE.Color(PALETTE.sea)

/** World-space rectangle [minX, minZ, maxX, maxZ] covered by an area. */
export const areaRect = (f: Heightfield): [number, number, number, number] => [
  f.area.west - 122, -(f.area.north - 12), f.area.east - 122, -(f.area.south - 12),
]

function build(f: Heightfield, segX: number, segY: number) {
  const { west, east, south, north } = f.area
  const geo = new THREE.PlaneGeometry(east - west, north - south, segX, segY)
  geo.rotateX(-Math.PI / 2)
  geo.translate((west + east) / 2 - 122, 0, -((south + north) / 2 - 12))
  const pos = geo.attributes.position as THREE.BufferAttribute
  const colors = new Float32Array(pos.count * 3)
  const seaW = new Float32Array(pos.count)
  const c = new THREE.Color()
  for (let v = 0; v < pos.count; v++) {
    const lon = pos.getX(v) + 122, lat = 12 - pos.getZ(v)
    const m = f.at(lon, lat)
    pos.setY(v, toHeight(m))
    if (m <= 0) c.copy(sea)
    else c.lerpColors(low, high, Math.min(1, Math.pow(m / 2600, 0.7)))
    c.toArray(colors, v * 3)
    // 1 in open water, easing to 0 across the shelf so coasts keep a faint edge
    seaW[v] = THREE.MathUtils.clamp(-m / 120, 0, 1)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.setAttribute('aSea', new THREE.BufferAttribute(seaW, 1))
  // the plane keeps its flat up-normal; all slope lighting comes from the full-resolution normal map

  // tangent-space normal map from the heightfield, rows bottom-up (south first) to match the plane's UVs
  const { w, h, metres } = f
  const dx = ((east - west) / w), dz = ((north - south) / h)
  const data = new Uint8Array(w * h * 4)
  const H = (i: number, j: number) => toHeight(metres[Math.min(h - 1, Math.max(0, j)) * w + Math.min(w - 1, Math.max(0, i))])
  const n = new THREE.Vector3()
  for (let r = 0; r < h; r++) {
    const j = h - 1 - r
    for (let i = 0; i < w; i++) {
      const sx = (H(i + 1, j) - H(i - 1, j)) / (2 * dx)
      const sn = (H(i, j - 1) - H(i, j + 1)) / (2 * dz) // rising toward the north
      n.set(-sx, -sn, 1).normalize()
      const o = (r * w + i) * 4
      data[o] = (n.x * 0.5 + 0.5) * 255
      data[o + 1] = (n.y * 0.5 + 0.5) * 255
      data[o + 2] = (n.z * 0.5 + 0.5) * 255
      data[o + 3] = 255
    }
  }
  const normalMap = new THREE.DataTexture(data, w, h, THREE.RGBAFormat)
  normalMap.generateMipmaps = true
  normalMap.minFilter = THREE.LinearMipmapLinearFilter
  normalMap.magFilter = THREE.LinearFilter
  normalMap.anisotropy = 4
  normalMap.needsUpdate = true
  return { geo, normalMap }
}

/**
 * One baked area of the map as a displaced, matte, monochrome surface. `hole` presses the surface
 * down inside a rectangle so a finer area can take its place without the two fighting.
 */
export default function Terrain({ name, segments, hole, relief = 1.6 }: {
  name: AreaName
  segments: [number, number]
  hole?: [number, number, number, number] | null
  /** strength of the normal-map shading; finer areas need less to match the coarse map */
  relief?: number
}) {
  const field = use(loadHeightfield(name))
  const { geo, normalMap } = useMemo(() => build(field, segments[0], segments[1]), [field, segments])
  const uniforms = useMemo(() => ({ uHole: { value: new THREE.Vector4() }, uHoleOn: { value: 0 }, uGround: { value: new THREE.Color(PALETTE.ground) } }), [])
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, normalMap, normalScale: new THREE.Vector2(relief, relief) })
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms)
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform vec4 uHole;\nuniform float uHoleOn;\nattribute float aSea;\nvarying float vSea;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vSea = aSea;
          if (uHoleOn > 0.5 && transformed.x > uHole.x && transformed.x < uHole.z && transformed.z > uHole.y && transformed.z < uHole.w) transformed.y -= 0.4;`)
      // after lighting and colour conversion, open sea takes the exact page ground, so the map has no edge
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uGround;\nvarying float vSea;')
        .replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.rgb = mix(gl_FragColor.rgb, uGround, vSea);')
    }
    return m
  }, [normalMap, uniforms, relief])

  useEffect(() => {
    uniforms.uHoleOn.value = hole ? 1 : 0
    if (hole) uniforms.uHole.value.set(...hole)
  }, [hole, uniforms])
  useEffect(() => () => { geo.dispose(); normalMap.dispose(); material.dispose() }, [geo, normalMap, material])

  return <mesh geometry={geo} material={material} />
}
