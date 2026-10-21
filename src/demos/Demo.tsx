import type { Chapter, Group } from '../content'
import type { DemoSpec } from '../worlds/issues'
import { useMode } from '../worlds/mode'
import { DemoCard } from '../ui/ChapterCard'
import StoryStages from './StoryStages'
import Gongs from './Gongs'
import WeaveDraw from './WeaveDraw'
import { strings } from '../i18n/t'

/**
 * The panel beside a chapter, if it has one. The myths scene plays at the side as the chapter is
 * read. The gongs and the weave live on the 3D models; only readers without them (no WebGL, or
 * reduced motion) get the flat versions here.
 */
export default function Demo({ spec, sectionId }: { spec: DemoSpec; chapter: Chapter; group: Group; sectionId: string }) {
  const flat = useMode() === 'static'
  const d = strings.demo
  switch (spec.kind) {
    case 'story':
      return <DemoCard title={d.story.title} caption={d.story.caption}><StoryStages scene={spec.scene} sectionId={sectionId} /></DemoCard>
    case 'gongs':
      return flat ? <DemoCard title={d.gongs.title} note={d.synthesized}><Gongs kind={spec.gong} /></DemoCard> : null
    case 'weave':
      return flat ? (
        <DemoCard title={d.weave.title} caption={spec.structure === 'plain' ? d.weave.plain : d.weave.twill}>
          <WeaveDraw sectionId={sectionId} structure={spec.structure} colors={spec.colors} />
        </DemoCard>
      ) : null
  }
}
