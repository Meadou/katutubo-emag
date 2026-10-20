import * as THREE from 'three'
import type { Sheet } from '../worlds/land'

/**
 * Shared paper helpers. World space: x = lon - 122, z = -(lat - 12), 1 unit = 1 degree.
 *
 * Every area stacks its sheets by the same rule, so a place's finer paper lines up with the
 * archipelago's coarser paper as the camera zooms in. Heights follow the square root of elevation:
 * cut at the shared contour levels, that spaces the sheets almost evenly, like a paper diorama.
 */
export const toX = (lon: number) => lon - 122
export const toZ = (lat: number) => -(lat - 12)

const COAST = 0.012
const RISE = 0.0032
/** The open sea's floor, below the shallow shelf at height 0. */
export const SEA_FLOOR = -0.012
/** Height of the top of a sheet cut at `level` metres. */
export const heightOf = (level: number) => (level <= 0 ? 0 : COAST + RISE * Math.sqrt(level))
/** Where a level sits on a world's colour ramp, shore to summit. */
export const shadeOf = (level: number) => Math.min(1, Math.max(0, Math.sqrt(Math.max(0, level) / 2400)))

/**
 * The place whose finer paper is resolving, shared by every archipelago sheet: inside its box the
 * archipelago gives way, pixel by pixel, as `mix` goes from 0 to 1. Box: x0, z0, x1, z1.
 */
export const detail = {
  box: { value: new THREE.Vector4(0, 0, 0, 0) },
  mix: { value: 0 },
}
export type Detail = typeof detail
export const newDetail = (): Detail => ({ box: { value: new THREE.Vector4(0, 0, 0, 0) }, mix: { value: 0 } })

// the archipelago keeps a hairline just inside the box, so the two papers always meet without a gap
const EDGE = 0.0006
const BOX_GLSL = /* glsl */ `
  uniform vec4 uBox;
  uniform float uMix;
  varying vec3 vPaperWorld;
  bool paperInBox(float e) {
    return vPaperWorld.x > uBox.x + e && vPaperWorld.x < uBox.z - e && vPaperWorld.z > uBox.y + e && vPaperWorld.z < uBox.w - e;
  }
  // interleaved gradient noise: an even, still dither for the dissolve
  float paperDither() { return fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))); }
`

/**
 * How a sheet takes part in the zoom: `base` is the archipelago (gives way inside the resolving
 * place), `detail` is a place's finer paper (only inside its box, as far as it has resolved), and
 * `plain` is anything else.
 */
export type Role = 'base' | 'detail' | 'plain'

function inject(shader: THREE.WebGLProgramParametersWithUniforms, role: Role, u: Detail) {
  if (role === 'plain') return
  shader.uniforms.uBox = u.box
  shader.uniforms.uMix = u.mix
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vPaperWorld;')
    .replace('#include <project_vertex>', '#include <project_vertex>\nvPaperWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;')
  // the place keeps its own side walls at the box edge: where it stands higher than the map, they read as a cut cliff
  const test = role === 'base' ? `if (paperInBox(${EDGE}) && paperDither() < uMix) discard;` : 'if (!paperInBox(-0.00001) || paperDither() >= uMix) discard;'
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>\n${BOX_GLSL}`)
    .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>\n${test}`)
}

/** Flat paper with a fine, still grain (screen-space, so it never crawls as the camera moves). */
export function paperMaterial(color = '#ffffff', role: Role = 'plain', u: Detail = detail) {
  const m = new THREE.MeshLambertMaterial({ color })
  // where the map gives way to a place, its sheets are cut open: both faces of the paper are drawn, so a cut shows paper, not a hole
  if (role === 'base') m.side = THREE.DoubleSide
  m.onBeforeCompile = (shader) => {
    inject(shader, role, u)
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
       float grain = fract(sin(dot(floor(gl_FragCoord.xy * 0.75), vec2(12.9898, 78.233))) * 43758.5453);
       diffuseColor.rgb *= 0.965 + 0.05 * grain;`,
    )
  }
  m.customProgramCacheKey = () => `paper-${role}`
  return m
}

/** The shadow-casting twin of a base sheet: inside a resolved place it casts nothing, so it never darkens the finer paper. */
export function baseDepthMaterial(u: Detail = detail) {
  const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking })
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uBox = u.box
    shader.uniforms.uMix = u.mix
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPaperWorld;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvPaperWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${BOX_GLSL}`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>\nif (paperInBox(${EDGE}) && uMix > 0.5) discard;`)
  }
  m.customProgramCacheKey = () => 'paper-depth-base'
  return m
}

/** One sheet's polygons as THREE shapes (lon/lat rings → shape space x = lon-122, y = lat-12). */
export function sheetShapes(sheet: Sheet, x: (v: number) => number = (v) => v - 122, y: (v: number) => number = (v) => v - 12) {
  const shapes: THREE.Shape[] = []
  for (const poly of sheet.polys) {
    const [outer, ...holes] = poly
    const pts = (r: number[]) => { const out: THREE.Vector2[] = []; for (let i = 0; i < r.length; i += 2) out.push(new THREE.Vector2(x(r[i]), y(r[i + 1]))); return out }
    const shape = new THREE.Shape(pts(outer))
    for (const h of holes) shape.holes.push(new THREE.Path(pts(h)))
    shapes.push(shape)
  }
  return shapes
}

/** Extrudes shapes into a paper sheet lying flat, its top at y = top. */
export function extrudeSheet(shapes: THREE.Shape[], thickness: number, top: number) {
  const g = new THREE.ExtrudeGeometry(shapes, { depth: thickness, bevelEnabled: false, curveSegments: 1 })
  g.rotateX(-Math.PI / 2)
  g.translate(0, top - thickness, 0)
  return g
}

/** Even-odd point-in-polygon on a flat [lon, lat, ...] ring. */
export function inRing(r: number[], lon: number, lat: number) {
  let inside = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1]
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** The highest level whose sheet covers a point (or -Infinity over open sea). */
export function levelAt(sheets: Sheet[], lon: number, lat: number) {
  for (let k = sheets.length - 1; k >= 0; k--) {
    for (const [outer, ...holes] of sheets[k].polys) {
      if (inRing(outer, lon, lat) && !holes.some((h) => inRing(h, lon, lat))) return sheets[k].level
    }
  }
  return -Infinity
}

/** Height of the paper at a point: the top of the highest sheet that covers it. */
export const groundAt = (sheets: Sheet[], lon: number, lat: number) => {
  const l = levelAt(sheets, lon, lat)
  return l === -Infinity ? SEA_FLOOR : heightOf(l)
}
