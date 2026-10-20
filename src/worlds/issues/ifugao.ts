import type { IssueDesign } from '.'

/** Ifugao: the zoom lands in the Cordillera, on terraced slopes near Banaue. */
export const ifugao: IssueDesign = {
  area: 'cordillera',
  focus: { lon: 121.06, lat: 16.92 },
  shots: {
    stop: { dist: 0.5, tilt: 0.9, yaw: 0.2 },
    overview: { dist: 0.3, tilt: 0.98, yaw: 0.5 },
    'myths-stories': { dist: 0.5, tilt: 0.78, yaw: -0.4, dlat: 0.02 },
    music: { dist: 0.22, tilt: 0.9, yaw: -0.9 },
    'beliefs-rituals': { dist: 0.55, tilt: 0.82, yaw: 0.15 },
    crafts: { dist: 0.26, tilt: 1.0, yaw: 1.3 },
    sources: { dist: 0.85, tilt: 0.55, yaw: 0.2, dlat: 0.03 },
  },
  demos: {
    overview: { kind: 'region' },
    'myths-stories': { kind: 'story', scene: 'flood' },
    music: { kind: 'gongs', gong: 'flat' },
    'beliefs-rituals': { kind: 'terms' },
    // the red, black and white the Crafts chapter names; structure only, no Ifugao design
    crafts: { kind: 'weave', structure: 'plain', colors: ['#8e2a2a', '#1d1b17', '#efe7d6'] },
  },
}
