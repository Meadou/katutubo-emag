/**
 * The themes the ten peoples are compared under, in the order the comparison takes them. Labels only:
 * which peoples carry a theme, and what they call it, lives in each people's own article frontmatter
 * (`themes:` for stories, `instruments:` for music), next to the sources that support it.
 */
export interface Theme {
  key: string
  /** what the comparison calls it */
  label: string
  /** a story theme (read from `themes:`) or an instrument (read from `instruments:`) */
  kind: 'story' | 'music'
}

export const THEMES: Theme[] = [
  { key: 'creation', label: 'How the world and the people began', kind: 'story' },
  { key: 'culture-hero', label: 'Heroes and epics', kind: 'story' },
  { key: 'sky-and-underworld', label: 'The sky world and the world below', kind: 'story' },
  { key: 'boat-lute', label: 'The two-string boat lute', kind: 'music' },
  { key: 'gong', label: 'Gongs', kind: 'music' },
  { key: 'bamboo', label: 'Bamboo zithers, jaw harps and flutes', kind: 'music' },
]

export const THEME_KEYS = THEMES.map((t) => t.key)
