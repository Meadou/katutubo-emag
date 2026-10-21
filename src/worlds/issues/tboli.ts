import type { IssueDesign } from '.'

/** T'boli: the camera comes down over the highlands around Lake Sebu. */
export const tboli: IssueDesign = {
  focus: { lon: 124.7, lat: 6.215 },
  shots: {
    stop: { dist: 2.6, tilt: 0.78, yaw: 0.3 },
    overview: { dist: 2.2, tilt: 0.85, yaw: 0.6 },
    'myths-stories': { dist: 2.6, tilt: 0.7, yaw: -0.5, dlat: 0.1 },
    music: { dist: 1.9, tilt: 0.88, yaw: -1.0 },
    'beliefs-rituals': { dist: 2.8, tilt: 0.72, yaw: 0.2 },
    crafts: { dist: 2.0, tilt: 0.92, yaw: 1.4 },
    sources: { dist: 3.2, tilt: 0.55, yaw: 0.1 },
  },
  demos: {
    // abaca to thread to cloth; t'nalak designs are dream-given and are not drawn
    'myths-stories': { kind: 'story', scene: 'abaca' },
    music: { kind: 'gongs', gong: 'bossed' },
    // the browns, reds and creams the Overview names; plain abaca weave, no t'nalak design
    crafts: { kind: 'weave', structure: 'plain', colors: ['#5a3a24', '#8e2f2a', '#e8dcc4'] },
  },
  // the object a chapter shows is named in the chapter's own words
  labels: { music: 'klintang' },
}
