import { smooth } from './blend'

/** A page section that holds one world, measured in document pixels. */
export interface SectionBox { id: string; world: string; top: number; height: number }

export interface Position {
  /** world on the near side of the nearest boundary */
  from: string
  /** world on the far side */
  to: string
  /** 0..1 eased progress across the boundary; 0 while a world holds */
  t: number
  /** index of the section under the reading line */
  index: number
  /** sections either side of the boundary (equal while a world holds) */
  fromIndex: number
  toIndex: number
}

/**
 * Which world the reader is in. The reading line sits at mid-screen. A world holds while the line
 * is inside its section, and hands over to the next across a short zone either side of the boundary,
 * so each chapter's world stays pinned while its text moves over it.
 */
export function worldAt(sections: SectionBox[], scrollY: number, vh: number): Position {
  if (!sections.length) return { from: '', to: '', t: 0, index: -1, fromIndex: -1, toIndex: -1 }
  const line = scrollY + vh * 0.5
  let index = sections.findIndex((s) => line < s.top + s.height)
  if (index < 0) index = sections.length - 1
  for (let i = 0; i < sections.length - 1; i++) {
    const a = sections[i], b = sections[i + 1]
    const edge = b.top
    const m = Math.min(vh * 0.35, a.height / 3, b.height / 3)
    if (line >= edge - m && line <= edge + m) {
      return { from: a.world, to: b.world, t: smooth((line - (edge - m)) / (2 * m)), index, fromIndex: i, toIndex: i + 1 }
    }
  }
  const s = sections[index]
  return { from: s.world, to: s.world, t: 0, index, fromIndex: index, toIndex: index }
}

/** How far the reading line has travelled through a section: 0 at its top, 1 at its bottom. */
export function readingProgress(s: SectionBox, scrollY: number, vh: number): number {
  return Math.min(1, Math.max(0, (scrollY + vh * 0.5 - s.top) / s.height))
}
