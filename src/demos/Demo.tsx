import type { Chapter, Group } from '../content'
import type { DemoSpec } from '../worlds/issues'
import type { AreaName } from '../worlds/types'
import { DemoCard } from '../ui/ChapterCard'
import RegionMap from './RegionMap'
import StoryStages from './StoryStages'
import Gongs from './Gongs'
import Terms, { Lines } from './Terms'
import WeaveDraw from './WeaveDraw'
import { fill, strings } from '../i18n/t'

/** The demo paired with a chapter, in its card, with the caption that keeps it honest. */
export default function Demo({ spec, chapter, group, area, sectionId }: { spec: DemoSpec; chapter: Chapter; group: Group; area: AreaName; sectionId: string }) {
  const d = strings.demo
  switch (spec.kind) {
    case 'region':
      return (
        <DemoCard title={d.region.title} caption={fill(d.region.caption, { region: group.region })}>
          <RegionMap lon={group.lon} lat={group.lat} area={area} />
        </DemoCard>
      )
    case 'story':
      return <DemoCard title={d.story.title} caption={d.story.caption}><StoryStages scene={spec.scene} sectionId={sectionId} /></DemoCard>
    case 'gongs':
      return <DemoCard title={d.gongs.title} note={d.synthesized}><Gongs kind={spec.gong} /></DemoCard>
    case 'terms':
      return chapter.terms.length ? (
        <DemoCard title={d.terms.title} caption={d.terms.caption}><Terms terms={chapter.terms} html={chapter.html} /></DemoCard>
      ) : (
        <DemoCard title={d.terms.title} caption={d.terms.captionLines}><Lines html={chapter.html} /></DemoCard>
      )
    case 'weave':
      return (
        <DemoCard title={d.weave.title} caption={spec.structure === 'plain' ? d.weave.plain : d.weave.twill}>
          <WeaveDraw sectionId={sectionId} structure={spec.structure} colors={spec.colors} />
        </DemoCard>
      )
  }
}
