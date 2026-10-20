import { create } from 'zustand'

/** The little shared UI state: which people's place is being pointed at (cover list, map pins). */
export const useUi = create<{ hovered: string | null; setHovered: (s: string | null) => void }>((set) => ({
  hovered: null,
  setHovered: (hovered) => set({ hovered }),
}))
