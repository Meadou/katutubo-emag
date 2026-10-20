import * as THREE from 'three'
import type { Sheet } from '../worlds/land'

/**
 * Shared paper helpers. World space: x = lon - 122, z = -(lat - 12), 1 unit = 1 degree; sheets stack
 * upward in y at a fixed gap per area (a diorama, not a survey: real relief would be invisible).
 */
export const toX = (lon: number) => lon - 122
export const toZ = (lat: number) => -(lat - 12)

/** Sheet gap per area, so each diorama reads clearly at the distance the camera views it from. */
export const GAP: Record<string, number> = { archipelago: 0.055, cordillera: 0.009, mindoro: 0.0095, lakesebu: 0.0046 }

/** Flat paper with a fine, still grain (screen-space, so it never crawls as the camera moves). */
export function paperMaterial(color = '#ffffff') {
  const m = new THREE.MeshLambertMaterial({ color })
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
       float grain = fract(sin(dot(floor(gl_FragCoord.xy * 0.75), vec2(12.9898, 78.233))) * 43758.5453);
       diffuseColor.rgb *= 0.965 + 0.05 * grain;`,
    )
  }
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

/** Height of the paper stack at a point: the top of the highest sheet that covers it. */
export function stackHeightAt(sheets: Sheet[], gap: number, lon: number, lat: number, base = 0) {
  for (let k = sheets.length - 1; k >= 0; k--) {
    for (const [outer, ...holes] of sheets[k].polys) {
      if (inRing(outer, lon, lat) && !holes.some((h) => inRing(h, lon, lat))) return base + (k + 1) * gap
    }
  }
  return base
}
