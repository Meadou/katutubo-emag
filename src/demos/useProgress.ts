import { useEffect, useState } from 'react'
import { journey, onFrame } from '../worlds/engine'

/**
 * Which of `stops` (ascending 0..1) the reader has passed in a section: re-renders only when that
 * changes. In calm mode every stage shows at once.
 */
export function useStage(sectionId: string, stops: number[]): number {
  const [stage, setStage] = useState(() => (journey.calm ? stops.length - 1 : 0))
  useEffect(() => {
    if (journey.calm) { setStage(stops.length - 1); return }
    return onFrame(() => {
      const p = journey.progress[sectionId] ?? 0
      let s = 0
      for (let i = 0; i < stops.length; i++) if (p >= stops[i]) s = i
      setStage((cur) => (cur === s ? cur : s))
    })
  }, [sectionId, stops])
  return stage
}

/** Calls `apply(progress)` every frame for a section (for drawings that follow the scroll exactly). */
export function useProgressFrame(sectionId: string, apply: (p: number) => void) {
  useEffect(() => {
    if (journey.calm) { apply(1); return }
    return onFrame(() => apply(journey.progress[sectionId] ?? 0))
  }, [sectionId, apply])
}
