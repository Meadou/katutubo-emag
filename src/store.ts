import { create } from 'zustand'

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
  /** high-quality effects (bloom etc.), lowered automatically on slow devices */
  hq: boolean
  setScene: (s: string) => void
  setChapter: (i: number) => void
  setHovered: (s: string | null) => void
  setFlyTo: (s: string | null) => void
  setHq: (v: boolean) => void
}

export const useMag = create<MagState>((set) => ({
  scene: 'home',
  chapter: 0,
  hovered: null,
  flyTo: null,
  hq: true,
  setScene: (scene) => set({ scene, chapter: 0, flyTo: null }),
  setChapter: (chapter) => set({ chapter }),
  setHovered: (hovered) => set({ hovered }),
  setFlyTo: (flyTo) => set({ flyTo }),
  setHq: (hq) => set({ hq }),
}))

/** Audio level 0..1 written by the music player, read every frame by 3D gongs (no React re-render). */
export const audioLevel = { current: 0, bands: new Float32Array(8) }

/** Normalised page scroll 0..1, read in useFrame. */
export const scrollState = { progress: 0 }

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
