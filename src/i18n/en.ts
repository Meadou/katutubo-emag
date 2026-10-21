/**
 * Every interface string, in English. A Filipino edition adds a sibling file with the same keys;
 * the article text itself lives in src/content/groups/*.md.
 */
export const en = {
  site: {
    name: 'Katutubo',
    masthead: 'the first peoples of the islands',
    skip: 'Skip to the story',
  },
  crumb: {
    label: 'Journey',
    open: 'Choose where to go',
    journey: 'The journey',
    issues: 'All issues',
    about: 'About',
    chapters: 'Chapters',
    sound: 'Sound',
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    soundNote: 'Wind and water, synthesized in your browser. Not a recording.',
  },
  intro: {
    over: 'Issue 01 · An e-magazine',
    lede: 'A journey to nine Indigenous Peoples of the Philippines: three in Luzon, three in the Visayas and three in Mindanao.',
    begin: 'Begin the journey',
    cue: 'or scroll',
  },
  regions: {
    Luzon: 'Masters of the Mist, Rice, and Rivers',
    Visayas: 'Keepers of Epic Chants, Embroidery, and Ancestral Lands',
    Mindanao: 'Epics, Dream-Inspired Textiles, and Maritime Heritage',
  },
  journey: {
    aka: 'also known as {aka}',
    draft: 'Draft: facts still need checking against community, NCIP and academic sources.',
    terms: 'Key terms',
    sources: 'Sources and further reading',
    endTitle: 'The end of the journey, for now',
    endBody: '{ready} issues are ready to read; {soon} are still being prepared with care.',
    again: 'Back to the start',
    issues: 'All issues',
  },
  soon: {
    title: 'Coming soon',
    body: 'This issue is still being prepared. Its stories will be shared here once they have been gathered and checked with care.',
  },
  labels: {
    tapGong: 'Tap a gong to hear it.',
    play: 'Play the pattern',
    stop: 'Stop',
    synthesized: 'Synthesized, not a recording.',
    weave: 'Plain weave, thread by thread. Structure only, not a community design.',
  },
  demo: {
    story: { title: 'The story, in stages', caption: 'Each scene appears as you read its part. People are drawn still, as silhouettes.', scene: 'Scene {n} of {of}' },
    gongs: {
      title: 'Strike the gongs',
      flat: 'Tap a gong, or play an interlocking pattern: each gong keeps its own part, and the parts fit together.',
      bossed: 'Tap the raised knob of a gong, or play a short pattern.',
      play: 'Play the pattern',
      stop: 'Stop',
      gong: 'Gong {n}',
    },
    synthesized: 'Synthesized in your browser to suggest the sound. Not a recording and not a traditional piece.',
    weave: {
      title: 'Thread by thread',
      plain: 'A plain over-and-under weave draws itself as you scroll: warp first, then the weft. Structure only, not a design of the community.',
      twill: 'A twill weave draws itself as you scroll. Structure only, not a design of the community.',
    },
  },
  index: {
    title: 'Issues',
    summary: '{total} peoples, north to south. {ready} issues to read, {soon} being prepared.',
    filter: 'Filter by island group',
    all: 'All',
    empty: 'No stories from {group} yet. More issues are on the way.',
  },
  about: {
    title: 'About Katutubo',
    meaning: '<em>Katutubo</em> means "native" or "indigenous". This e-magazine introduces some of the Indigenous Peoples of the Philippines through their stories, music, beliefs and crafts, so that more Filipinos can know and value them.',
    respectTitle: 'A note on respect',
    respect: 'Each culture here belongs to living communities. We use the names the communities use for themselves. We try not to treat sacred objects or rituals as decoration: they are kept still, and only named. Every article lists its sources. If you belong to one of these communities and see an error, we want to hear from you.',
    madeTitle: 'How it is made',
    made: 'A static website, with no database and no tracking. The land is cut from paper sheets, one for each contour of open elevation data (Terrain Tiles on AWS: SRTM, ETOPO1 and other sources). The gong and the loom are simple models drawn for illustration. The wind and water you can turn on, and any instrument, are synthesized in your browser to suggest a sound; nothing is a recording or a traditional piece.',
  },
  loading: 'Laying out the paper',
  loaded: 'Ready',
  notFound: { title: 'Story not found', back: 'Back to the issues' },
}

export type Strings = typeof en
