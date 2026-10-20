import { ShapeUtils, Vector2 } from 'three'

/** One sheet's geometry, ready for a BufferGeometry: indexed, top faces first, then the walls. */
export interface SheetBuffers {
  position: Float32Array
  normal: Float32Array
  index: Uint32Array
  /** how many indices are top faces; the rest are walls (so a sheet is exactly two draw calls) */
  capIndexCount: number
}

/**
 * A sheet of paper cut along its polygons (each [outer, ...holes], rings as flat [lon, lat, ...]),
 * its top at `top` and as thick as `thickness`. World space: x = lon - 122, z = -(lat - 12).
 *
 * Unlike ExtrudeGeometry, which makes two draw groups for every separate polygon (thousands for the
 * archipelago), all top faces share one group and all walls the other. The bottom, never seen, is
 * left out, and so are texture coordinates.
 */
export function buildSheet(polys: number[][][], top: number, thickness: number): SheetBuffers {
  const bottom = top - thickness
  let points = 0, edges = 0
  for (const poly of polys) for (const r of poly) { points += r.length / 2; edges += r.length / 2 }
  const position = new Float32Array((points + edges * 4) * 3)
  const normal = new Float32Array(position.length)
  const caps: number[] = []
  const walls = new Uint32Array(edges * 6)
  let v = 0, w = 0

  const put = (x: number, y: number, z: number, nx: number, ny: number, nz: number) => {
    position[v * 3] = x; position[v * 3 + 1] = y; position[v * 3 + 2] = z
    normal[v * 3] = nx; normal[v * 3 + 1] = ny; normal[v * 3 + 2] = nz
    return v++
  }

  for (const poly of polys) {
    // the top: one triangulation of the polygon with its holes, on vertices shared by its triangles
    const base = v
    const rings = poly.map((r) => {
      const pts: Vector2[] = []
      for (let i = 0; i < r.length; i += 2) {
        const x = r[i] - 122, z = -(r[i + 1] - 12)
        pts.push(new Vector2(x, z))
        put(x, top, z, 0, 1, 0)
      }
      return pts
    })
    const tris = ShapeUtils.triangulateShape(rings[0], rings.slice(1))
    const all = rings.flat()
    for (const [a, b, c] of tris) {
      // keep every top face pointing up, whatever winding the triangulation returns
      const pa = all[a], pb = all[b], pc = all[c]
      const up = (pb.y - pa.y) * (pc.x - pa.x) - (pb.x - pa.x) * (pc.y - pa.y) > 0
      caps.push(base + a, ...(up ? [base + b, base + c] : [base + c, base + b]))
    }

    // the walls: a quad on every edge, facing away from the paper (out of the outer ring, into a hole)
    poly.forEach((r, k) => {
      const n = r.length / 2
      let area = 0
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n
        const xi = r[i * 2] - 122, zi = -(r[i * 2 + 1] - 12), xj = r[j * 2] - 122, zj = -(r[j * 2 + 1] - 12)
        area += xi * zj - xj * zi
      }
      // right-hand normal (dz, -dx) points out of a ring wound with positive area in (x, z)
      const side = Math.sign(area) * (k === 0 ? 1 : -1)
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n
        const ax = r[i * 2] - 122, az = -(r[i * 2 + 1] - 12), bx = r[j * 2] - 122, bz = -(r[j * 2 + 1] - 12)
        const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz) || 1
        const nx = (side * dz) / len, nz = (-side * dx) / len
        const ab = put(ax, bottom, az, nx, 0, nz), bb = put(bx, bottom, bz, nx, 0, nz)
        const bt = put(bx, top, bz, nx, 0, nz), at = put(ax, top, az, nx, 0, nz)
        // (ab, bb, bt) faces (-dz, dx): flip it when the wall must face the other way
        if (-dz * nx + dx * nz > 0) walls.set([ab, bb, bt, ab, bt, at], w)
        else walls.set([ab, bt, bb, ab, at, bt], w)
        w += 6
      }
    })
  }

  const index = new Uint32Array(caps.length + walls.length)
  index.set(caps, 0)
  index.set(walls, caps.length)
  return { position: position.subarray(0, v * 3), normal: normal.subarray(0, v * 3), index, capIndexCount: caps.length }
}
