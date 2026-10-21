import type { IssueDesign } from '.'

/** Ifugao: the camera comes down over the Cordillera, near Banaue. */
export const ifugao: IssueDesign = {
  focus: { lon: 121.06, lat: 16.92 },
  shots: {
    stop: { dist: 2.6, tilt: 0.78, yaw: 0.2 },
    overview: { dist: 2.2, tilt: 0.85, yaw: 0.5 },
    'myths-stories': { dist: 2.6, tilt: 0.72, yaw: -0.4, dlat: 0.1 },
    music: { dist: 1.9, tilt: 0.88, yaw: -0.9 },
    'beliefs-rituals': { dist: 2.8, tilt: 0.7, yaw: 0.15 },
    crafts: { dist: 2.0, tilt: 0.92, yaw: 1.3 },
    sources: { dist: 3.2, tilt: 0.55, yaw: 0.2, dlat: 0.1 },
  },
  demos: {
    'myths-stories': { kind: 'story', scene: 'flood' },
    music: { kind: 'gongs', gong: 'flat' },
    // the red, black and white the Crafts chapter names; structure only, no Ifugao design
    crafts: { kind: 'weave', structure: 'plain', colors: ['#8e2a2a', '#1d1b17', '#efe7d6'] },
  },
  // the object a chapter shows is named in the chapter's own words
  labels: { music: 'gangsa' },
}
