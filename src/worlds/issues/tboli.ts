import type { IssueDesign } from '.'

/** T'boli: the zoom lands on the highlands around Lake Sebu. */
export const tboli: IssueDesign = {
  area: 'lakesebu',
  focus: { lon: 124.7, lat: 6.215 },
  shots: {
    stop: { dist: 0.3, tilt: 0.86, yaw: 0.3 },
    overview: { dist: 0.16, tilt: 0.95, yaw: 0.6 },
    'myths-stories': { dist: 0.32, tilt: 0.7, yaw: -0.5, dlat: 0.015 },
    music: { dist: 0.12, tilt: 0.9, yaw: -1.0 },
    'beliefs-rituals': { dist: 0.26, tilt: 0.8, yaw: 0.2 },
    crafts: { dist: 0.12, tilt: 0.98, yaw: 1.4 },
    sources: { dist: 0.36, tilt: 0.5, yaw: 0.1 },
  },
  demos: {
    overview: { kind: 'region' },
    // abaca to thread to cloth; t'nalak designs are dream-given and are not drawn
    'myths-stories': { kind: 'story', scene: 'abaca' },
    music: { kind: 'gongs', gong: 'bossed' },
    'beliefs-rituals': { kind: 'terms' },
    // the browns, reds and creams the Overview names; plain abaca weave, no t'nalak design
    crafts: { kind: 'weave', structure: 'plain', colors: ['#5a3a24', '#8e2f2a', '#e8dcc4'] },
  },
}
