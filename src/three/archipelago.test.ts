import { describe, expect, it } from 'vitest'
import { pointInIsland } from './archipelago'

describe('pointInIsland', () => {
  it('detects points on and off an island', () => {
    expect(pointInIsland('Panay', 122.2, 11.2)).toBe(true)
    expect(pointInIsland('Panay', 120.0, 11.0)).toBe(false)
    expect(pointInIsland('Guimaras', 122.6, 10.6)).toBe(false)
    expect(pointInIsland('Panay', NaN, 11.2)).toBe(false)
  })
})
