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
  nav: { label: 'Main', cover: 'Cover', issues: 'Issues', about: 'About' },
  cover: {
    over: 'Issue 01 · An e-magazine',
    lede: 'The stories, music, beliefs and crafts of the Indigenous Peoples of the Philippines, one world at a time.',
    cue: 'Scroll to begin',
    peoplesTitle: '{total} peoples, north to south',
    peoplesLede: 'Choose a people to fly to their land. {ready} issues are ready; {soon} are still being prepared.',
    listLabel: 'Peoples in Katutubo',
    soon: 'Coming soon',
    beginTitle: 'Begin in the north',
    begin: 'Fly to the {name}',
  },
  issue: {
    cue: 'Scroll to fly in',
    draft: 'Draft. Facts still need to be checked against community, NCIP and academic sources.',
    flying: 'Into {region}',
    chapters: 'Chapters',
    terms: 'Key terms',
    sources: 'Sources and further reading',
    nextLabel: 'Next world',
    next: 'Fly on to the {name}',
    backToMap: 'Back to the map',
  },
  soon: {
    title: 'Coming soon',
    body: 'This issue is still being prepared. Its stories, music and crafts will be shared here once they have been gathered and checked with care.',
    readFinished: 'Read a finished issue',
    readLink: 'Read a finished issue: the {name}',
  },
  demo: {
    region: { title: 'Where they live', caption: '{region}. The cut-out square is the land you just flew into.', zoom: 'Zoom to the region', wide: 'Show the whole archipelago' },
    story: { title: 'The story, in stages', caption: 'Each scene appears as you read its part. People are drawn still, as silhouettes.', scene: 'Scene {n} of {of}' },
    syllables: {
      title: 'Seven syllables a line',
      caption: 'Tap the seven beats of one line. These marks are abstract, not Surat Mangyan characters.',
      done: 'One line: seven syllables.',
      beat: 'Syllable {n}',
    },
    gongs: {
      title: 'Strike the gongs',
      flat: 'Tap a gong, or play an interlocking pattern: each gong keeps its own part, and the parts fit together.',
      bossed: 'Tap the raised knob of a gong, or play a short pattern.',
      play: 'Play the pattern',
      stop: 'Stop',
      gong: 'Gong {n}',
    },
    pluck: { title: 'Pluck the strings', caption: 'Tap or swipe across each string.', string: 'String {n}' },
    synthesized: 'Synthesized in your browser to suggest the sound. Not a recording and not a traditional piece.',
    terms: {
      title: 'Read slowly',
      caption: 'These things are sacred to many. Here they are simply named, in the words of the chapter.',
      pick: 'Choose a term to read the sentence it comes from.',
      captionLines: 'These things are sacred to many. The chapter is read one sentence at a time, with nothing moving.',
      next: 'Next sentence',
      count: '{n} of {of}',
    },
    weave: {
      title: 'Thread by thread',
      plain: 'A plain over-and-under weave draws itself as you scroll: warp first, then the weft. Structure only, not a design of the community.',
      twill: 'A twill basket weave draws itself as you scroll. Structure only, not a design of the community.',
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
    made: 'A static website, with no database and no tracking. The land is cut from paper sheets, one for each contour of open elevation data (Terrain Tiles on AWS: SRTM, ETOPO1 and other sources). The terraced mountain and the objects are drawn for illustration. Any sound is synthesized in your browser to suggest an instrument; it is not a recording or a traditional piece.',
  },
  loading: 'Laying out the paper',
  notFound: { title: 'Story not found', back: 'Back to the issues' },
}

export type Strings = typeof en
