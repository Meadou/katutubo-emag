import * as THREE from 'three'
import type { Sheet } from '../worlds/land'

/**
 * Shared paper helpers. World space: x = lon - 122, z = -(lat - 12), 1 unit = 1 degree.
 *
 * Sheets stack by the square root of elevation: cut at the map's contour levels, that spaces them
 * almost evenly, like a paper diorama.
 */
export const toX = (lon: number) => lon - 122
export const toZ = (lat: number) => -(lat - 12)

const COAST = 0.012
// enough relief that the map reads as 3D from the cover down to a people's land
const RISE = 0.0043
/** The open sea's floor, below the shallow shelf at height 0. */
export const SEA_FLOOR = -0.012
/** Height of the top of a sheet cut at `level` metres. */
export const heightOf = (level: number) => (level <= 0 ? 0 : COAST + RISE * Math.sqrt(level))
/** Where a level sits on a world's colour ramp, shore to summit. */
export const shadeOf = (level: number) => Math.min(1, Math.max(0, Math.sqrt(Math.max(0, level) / 2400)))

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
