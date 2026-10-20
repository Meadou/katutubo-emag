import { describe, expect, it } from 'vitest'
import { archipelagoCamera, zoomAbout } from './journeys'

describe('the opening view', () => {
  it('centres the archipelago on every screen shape', () => {
    for (const aspect of [0.46, 1, 1.6, 1.78, 2.4]) expect(archipelagoCamera(aspect).lon).toBe(121.9)
  })
  it('leans by zooming about the point pointed at, which keeps its place on screen', () => {
    const c = archipelagoCamera(1.6), pin = { lon: 121.3, lat: 17.38 }
    const z = zoomAbout(c, pin, 0.6)
    expect(z.dist).toBeCloseTo(c.dist * 0.6)
    // the pin's offset from the view's centre shrinks exactly as the view does, so on screen it does not move
    expect((pin.lon - z.lon) / z.dist).toBeCloseTo((pin.lon - c.lon) / c.dist)
    expect((pin.lat - z.lat) / z.dist).toBeCloseTo((pin.lat - c.lat) / c.dist)
    expect(z.tilt).toBe(c.tilt)
  })
})
