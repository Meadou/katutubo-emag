import type { IssueDesign } from '.'

/** Mangyan: the dive lands in the interior uplands of Mindoro. */
export const mangyan: IssueDesign = {
  area: 'mindoro',
  focus: { lon: 121.05, lat: 12.85 },
  shots: {
    overview: { dist: 0.4, tilt: 0.96, yaw: 0.7 },
    'myths-stories': { dist: 0.62, tilt: 0.72, yaw: -0.6, dlat: 0.03 },
    music: { dist: 0.52, tilt: 0.86, yaw: -1.1 },
    'beliefs-rituals': { dist: 0.66, tilt: 0.8, yaw: 0.3 },
    crafts: { dist: 0.34, tilt: 0.98, yaw: 1.5 },
    sources: { dist: 0.9, tilt: 0.5, yaw: 0.1 },
  },
  demos: {
    overview: { kind: 'region' },
    'myths-stories': { kind: 'syllables' },
    // gitgit and kudyapi are named in the chapter; the demo plucks a two-string lute (no gongs)
    music: { kind: 'pluck', strings: 2 },
    'beliefs-rituals': { kind: 'terms' },
    // basketry of nito vine and bamboo; weave structure only
    crafts: { kind: 'weave', structure: 'twill', colors: ['#6b4a2b', '#c9a46a', '#3a2a1a'] },
  },
}
