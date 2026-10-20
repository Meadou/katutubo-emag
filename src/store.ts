import { create } from 'zustand'
import type { IslandGroup } from './content'

/** Which part of the archipelago the cover's scroll story is looking at. */
export type CoverFocus = 'all' | IslandGroup

/** Shared state between the DOM magazine and the 3D canvas behind it. */
interface MagState {
  /** 'home' shows the archipelago; a slug shows that group's scene */
  scene: 'home' | 'index' | string
  /** index of the chapter currently on screen in an article */
  chapter: number
  /** marker the user is hovering on the map */
  hovered: string | null
  /** slug the camera is flying toward (set on marker click) */
  flyTo: string | null
  /** cover section on screen: the whole archipelago or one island group */
  coverFocus: CoverFocus
  setScene: (s: string) => void
  setChapter: (i: number) => void
  setHovered: (s: string | null) => void
  setFlyTo: (s: string | null) => void
  setCoverFocus: (f: CoverFocus) => void
}

export const useMag = create<MagState>((set) => ({
  scene: 'home',
  chapter: 0,
  hovered: null,
  flyTo: null,
  coverFocus: 'all',
  setScene: (scene) => set({ scene, chapter: 0, flyTo: null, coverFocus: 'all' }),
  setChapter: (chapter) => set({ chapter }),
  setHovered: (hovered) => set({ hovered }),
  setFlyTo: (flyTo) => set({ flyTo }),
  setCoverFocus: (coverFocus) => set({ coverFocus }),
}))

/** Audio level 0..1 written by the music player, read every frame by 3D gongs (no React re-render). */
export const audioLevel = { current: 0, bands: new Float32Array(8) }

/** Normalised page scroll 0..1, read in useFrame and by the ruler. */
export const scrollState = { progress: 0 }

/**
 * Per-frame values the DOM writes and the 3D reads.
 * tone: 0 = charcoal ground, 1 = bone ground (the canvas cross-fades toward it).
 * explode: 0..1, how far the current chapter's object has come apart.
 */
export const frameState = { tone: 0, explode: 0 }

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
