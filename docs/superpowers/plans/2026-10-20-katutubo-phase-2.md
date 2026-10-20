# Katutubo Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the v1 e-magazine under version control with automated tests, add "Coming soon" placeholder issues so every island group (Luzon, Visayas, Mindanao) appears, and make img2threejs objects a one-line drop-in.

**Architecture:** Content stays as Markdown in `src/content/groups/*.md`, parsed at build time by `src/content/index.ts`. A new `placeholder: true` frontmatter flag makes a group show up everywhere (map, cover, index) but render a short "coming soon" page. Pure helpers (`nextIssue`, `sceneObjectKeys`, `pointInIsland`) carry the logic so Vitest can pin it. A content-lint test guards every future `.md` file.

**Tech Stack:** Vite 8, React 19, TypeScript 7, @react-three/fiber 9 / drei 10, zustand 5, marked 18. New dev-only additions: vitest 5, jsdom, @testing-library/react + jest-dom + user-event, @react-three/test-renderer 9.

**Spec:** `docs/superpowers/specs/2026-10-20-katutubo-emag-design.md`. This is the original plan plus a "Phase 2 decisions" section.

## Global Constraints

- Static site only: no backend, no database, no runtime fetches of content. Content lives in `src/content/groups/*.md`.
- Keep `HashRouter` + `base: './'` in `vite.config.ts`. Deep links like `#/group/ati` must keep working on GitHub Pages.
- New packages go in **devDependencies only**. The shipped bundle gets no new runtime dependencies.
- CI uses Node 22 (`.github/workflows/deploy.yml`). Builds run `npm ci`, so commit `package-lock.json`.
- Placeholders: no facts, myths, music or taglines are written for them. Frontmatter has `name`, `slug`, `region`, `island`, `lon`, `lat`, `color`, `placeholder: true` and nothing else.
- Exact UI copy: badge/tagline `Coming soon`; placeholder body `This issue is still being prepared. Its stories, music and crafts will be shared here once they have been gathered and checked with care.`; placeholder footer kicker `Read a finished issue`.
- Every island group `Luzon`, `Visayas`, `Mindanao` has at least one group, which the lint test enforces.
- Existing drafts keep `draft: true` and their "verify" notes. Use endonyms. Do not change existing article text.
- `prefers-reduced-motion` behavior stays as it is.
- The developer is on Windows: tests must pass with CRLF line endings in `.md` files.

## Review Focus

1. **Deep link straight to a placeholder** (`#/group/ati` typed, bookmarked or refreshed). The page should show a calm coming-soon page with no empty chapter list and no crash. → Task 4, `renders a placeholder as a coming-soon page`.
2. **"Next issue" from the last finished issue** in north→south order (T'boli). It should wrap to Ifugao and never land on a placeholder. → Task 2, `nextIssue skips placeholders and wraps`.
3. **A new group file with a typo'd island** (`island: Guimaras`) **or missing `lat`**. Today it is silently filed under Luzon or placed at NaN. The test run should fail and name the file's slug. → Task 3, `content lint`.
4. **A `.md` file saved with Windows CRLF line endings.** Chapters and Sources should still split correctly. → Task 1, `handles CRLF line endings`.
5. **Hovering a placeholder's marker or cover link.** The hint should read `Ati: Coming soon`, not `Ati: ` with a dangling colon. → Task 4, `cover hint for a placeholder says Coming soon`.

---

### Task 1: Git baseline + Vitest harness

**Files:**
- Create: `vitest.config.ts`, `src/test/setup.ts`, `src/content/index.test.ts`
- Modify: `package.json` (scripts + devDeps), `.gitignore`, `src/content/index.ts` (export `parseGroup`), `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: `export function parseGroup(raw: string): Group` from `src/content/index.ts`. Produces the `npm test` script (`vitest run`), a jsdom environment, and the setup file. Later tests rely on the setup file's stubs.

- [ ] **Step 1: Commit the v1 baseline as-is**

Add `*.tsbuildinfo` to `.gitignore` first (the stray `tsconfig.tsbuildinfo` must not be committed).

```bash
git init -b main
git add -A
git commit -m "chore: v1 e-magazine baseline"
```
Expected: `git status` is clean. `git ls-files | grep tsbuildinfo` prints nothing.

- [ ] **Step 2: Install test tooling**

```bash
npm i -D vitest@^5.0.5 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```
Add the script `"test": "vitest run"`. Create `vitest.config.ts` with `mergeConfig` of `vite.config.ts` plus `test: { environment: 'jsdom', setupFiles: ['src/test/setup.ts'] }`.
`src/test/setup.ts`: import `@testing-library/jest-dom/vitest`, call `cleanup()` in `afterEach`, and stub three things jsdom lacks: `window.IntersectionObserver` (no-op observe/disconnect), `window.matchMedia` (returns `{ matches: false, addEventListener() {}, removeEventListener() {} }`) and `HTMLCanvasElement.prototype.getContext` (returns `null`).

- [ ] **Step 3: Write the failing test** in `src/content/index.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { parseGroup } from '.'

const RAW = `---
name: Test People
island: Panay
lon: 122.2
lat: 11.2
objects: loom, gong
draft: true
---

## Overview
Hello **world**.

## Music
Gongs.

## Crafts
Weaving.

## Sources
- A book
`

describe('parseGroup', () => {
  it('splits ## headings into chapters and pulls Sources out', () => {
    const g = parseGroup(RAW)
    expect(g.chapters.map((c) => c.title)).toEqual(['Overview', 'Music', 'Crafts'])
    expect(g.chapters[0].html).toContain('<strong>world</strong>')
    expect(g.sources).toContain('<li>A book</li>')
  })
  it('cycles the objects list across chapters', () => {
    expect(parseGroup(RAW).chapters.map((c) => c.object)).toEqual(['loom', 'gong', 'loom'])
  })
  it('derives slug, island group and draft flag', () => {
    const g = parseGroup(RAW)
    expect(g.slug).toBe('test-people')
    expect(g.islandGroup).toBe('Visayas')
    expect(g.draft).toBe(true)
  })
  it('handles CRLF line endings', () => {
    const g = parseGroup(RAW.replace(/\n/g, '\r\n'))
    expect(g.name).toBe('Test People')
    expect(g.chapters.map((c) => c.title)).toEqual(['Overview', 'Music', 'Crafts'])
    expect(g.sources).toContain('A book')
  })
})
```

- [ ] **Step 4: Run it and confirm it fails**

Run: `npm test`
Expected: FAIL. `parseGroup` is not exported.

- [ ] **Step 5: Add `export` to `parseGroup` in `src/content/index.ts`**

- [ ] **Step 6: Run it and confirm it passes**

Run: `npm test`, then `npm run build`
Expected: 4 tests pass and the build still succeeds. Tests import `describe`/`it`/`expect` explicitly from `vitest` (no globals). The jest-dom matcher types come from the setup file's import, which `tsc -b` sees because it lives under `src`.

- [ ] **Step 7: Run tests in CI**

In `.github/workflows/deploy.yml`, add `- run: npm test` between `npm ci` and `npm run build`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "test: add vitest harness and parseGroup tests; run tests in CI"
```

---

### Task 2: Placeholder flag + issue-navigation helpers

**Files:**
- Modify: `src/content/index.ts`
- Test: `src/content/index.test.ts`

**Interfaces:**
- Consumes: `parseGroup` (Task 1).
- Produces, from `src/content/index.ts`:
  - `Group.placeholder: boolean`. When it is true, `chapters` is `[]` and `sources` is `null`, and the body is ignored.
  - `export function nextIssue(slug: string, list: Group[] = groups): Group | null` returns the next **non-placeholder** group after `slug` in `list` order, wrapping around. It never returns the group itself. It returns `null` when there is no other finished issue or `slug` is unknown.
  - `export function sceneObjectKeys(group: Group): string[]` returns the unique chapter `object` keys in first-seen order, or `['spirits']` when there are no chapters.

- [ ] **Step 1: Write the failing tests** (append to `src/content/index.test.ts`)

```ts
import { nextIssue, sceneObjectKeys } from '.'

const make = (slug: string, placeholder = false) =>
  parseGroup(`---\nname: ${slug}\nslug: ${slug}\n${placeholder ? 'placeholder: true\n' : ''}---\n\n## Overview\nx\n\n## Sources\n- y\n`)

describe('placeholders', () => {
  it('ignores the body of a placeholder', () => {
    const p = make('p', true)
    expect(p.placeholder).toBe(true)
    expect(p.chapters).toEqual([])
    expect(p.sources).toBeNull()
    expect(make('a').placeholder).toBe(false)
  })
})

describe('nextIssue', () => {
  const [a, p1, b, p2] = [make('a'), make('p1', true), make('b'), make('p2', true)]
  const list = [a, p1, b, p2]
  it('nextIssue skips placeholders and wraps', () => {
    expect(nextIssue('a', list)?.slug).toBe('b')
    expect(nextIssue('b', list)?.slug).toBe('a')
    expect(nextIssue('p1', list)?.slug).toBe('b')
    expect(nextIssue('p2', list)?.slug).toBe('a')
  })
  it('returns null when there is no other finished issue', () => {
    expect(nextIssue('a', [a, p1])).toBeNull()
    expect(nextIssue('p1', [a, p1])?.slug).toBe('a')
    expect(nextIssue('nope', list)).toBeNull()
  })
})

describe('sceneObjectKeys', () => {
  it('dedupes chapter objects in order, spirits for placeholders', () => {
    expect(sceneObjectKeys(parseGroup(RAW))).toEqual(['loom', 'gong'])
    expect(sceneObjectKeys(make('p', true))).toEqual(['spirits'])
  })
})
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `npm test`
Expected: FAIL. `nextIssue` and `sceneObjectKeys` are not exported, and `placeholder` is undefined.

- [ ] **Step 3: Implement** `placeholder` (`meta.placeholder === 'true'`, skipping chapter parsing when it is true), `nextIssue` and `sceneObjectKeys` in `src/content/index.ts`

- [ ] **Step 4: Run them and confirm they pass**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/content
git commit -m "feat: placeholder flag, nextIssue and sceneObjectKeys helpers"
```

---

### Task 3: Content lint + placeholder issues for all three island groups

**Files:**
- Modify: `src/three/archipelago.ts`
- Create: `src/three/archipelago.test.ts`, `src/content/lint.test.ts`, `src/content/groups/aeta.md`, `src/content/groups/ati.md`, `src/content/groups/manobo.md`

**Interfaces:**
- Consumes: `groups`, `Group.placeholder` (Task 2); `ISLANDS` (existing); `OBJECTS` from `src/three/objects/registry.ts` (existing).
- Produces: `export function pointInIsland(island: string, lon: number, lat: number): boolean` in `src/three/archipelago.ts`. It ray-casts against `ISLANDS[island]` and returns `false` for an unknown island or non-finite coordinates.

- [ ] **Step 1: Write the failing tests**

`src/three/archipelago.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { pointInIsland } from './archipelago'

describe('pointInIsland', () => {
  it('detects points on and off an island', () => {
    expect(pointInIsland('Panay', 122.2, 11.2)).toBe(true)
    expect(pointInIsland('Panay', 120.0, 11.0)).toBe(false)
    expect(pointInIsland('Guimaras', 122.6, 10.6)).toBe(false)
    expect(pointInIsland('Panay', NaN, 11.2)).toBe(false)
  })
})
```

`src/content/lint.test.ts`. Each assertion message names the slug, so a broken file can be found immediately:
```ts
import { describe, expect, it } from 'vitest'
import { groups } from '.'
import { ISLANDS, pointInIsland } from '../three/archipelago'
import { OBJECTS } from '../three/objects/registry'

describe('content lint', () => {
  it('slugs are unique and url-safe', () => {
    const slugs = groups.map((g) => g.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const s of slugs) expect(s, s).toMatch(/^[a-z0-9-]+$/)
  })
  it.each(groups.map((g) => [g.slug, g] as const))('%s is valid', (slug, g) => {
    expect(Object.keys(ISLANDS), `${slug}: unknown island "${g.island}"`).toContain(g.island)
    expect(pointInIsland(g.island, g.lon, g.lat), `${slug}: marker not on ${g.island}`).toBe(true)
    expect(g.color, slug).toMatch(/^#[0-9a-f]{6}$/i)
    if (!g.placeholder) {
      expect(g.chapters.length, `${slug}: no chapters`).toBeGreaterThan(0)
      expect(g.sources, `${slug}: no Sources section`).not.toBeNull()
      for (const c of g.chapters) expect(Object.keys(OBJECTS), `${slug}: unknown object "${c.object}"`).toContain(c.object)
    }
  })
  it('covers Luzon, Visayas and Mindanao', () => {
    expect(new Set(groups.map((g) => g.islandGroup))).toEqual(new Set(['Luzon', 'Visayas', 'Mindanao']))
  })
})
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `npm test`
Expected: FAIL. `pointInIsland` is missing, and the coverage test fails because there is no Visayas group yet.

- [ ] **Step 3: Implement `pointInIsland`** (even-odd ray casting over the `[lon, lat]` polygon)

- [ ] **Step 4: Add the three placeholder files.** The frontmatter is exactly as follows, with no body.

| file | name | slug | region | island | lon | lat | color |
|---|---|---|---|---|---|---|---|
| `aeta.md` | Aeta | aeta | Zambales Mountains, Central Luzon | Luzon | 120.2 | 15.3 | #5b8e7d |
| `ati.md` | Ati | ati | Panay Island, Western Visayas | Panay | 122.2 | 11.2 | #4f9dde |
| `manobo.md` | Manobo | manobo | Bukidnon, Northern Mindanao | Mindanao | 125.0 | 8.0 | #b56576 |

Each file also has `placeholder: true`.

- [ ] **Step 5: Run them and confirm they pass**

Run: `npm test`
Expected: all tests pass. That covers 6 groups × the validity check, and the coverage test.

- [ ] **Step 6: Commit**

```bash
git add src/three/archipelago.ts src/three/archipelago.test.ts src/content
git commit -m "feat: content lint and placeholder issues for Aeta, Ati and Manobo"
```

---

### Task 4: Placeholder UI across cover, index, article and 3D

**Files:**
- Modify: `src/pages/Article.tsx`, `src/pages/IssueIndex.tsx`, `src/pages/Home.tsx`, `src/three/scenes/GroupScene.tsx`, `src/three/scenes/ArchipelagoScene.tsx`, `src/styles/global.css`
- Test: `src/pages/placeholder.test.tsx`

**Interfaces:**
- Consumes: `Group.placeholder`, `nextIssue`, `sceneObjectKeys` (Task 2); the placeholder content `ati` and `manobo` (Task 3); `useMag` (existing).
- Produces: UI only. Class names `.card--soon`, `.card__soon` and `.cover__soon` for styling.

Behavior:
- **Article.** For a placeholder, render the hero (kicker = region, `h1` = name, tagline `Coming soon`), the exact placeholder body copy (Global Constraints), and no TOC, chapters, sources or draft note. The footer kicker reads `Read a finished issue` and links to `nextIssue(slug)` if there is one. Skip the IntersectionObserver effect for placeholders. For finished issues, replace the inline `next` logic with `nextIssue(group.slug)`.
- **IssueIndex.** A placeholder card gets `card--soon` and shows `<span className="card__soon">Coming soon</span>` instead of the tagline. It still links to its page.
- **Home.** The cover hint reads `{name}: Coming soon` for placeholders. The cover list link gets a `<span className="cover__soon">Soon</span>` badge.
- **GroupScene.** `keys = sceneObjectKeys(group)`.
- **ArchipelagoScene `Marker`.** Placeholders skip the pulsing ring, draw the beam at opacity `0.3`, and show `Coming soon` in the label instead of the region. They stay clickable.
- **CSS.** Muted styling for the badges (`opacity` around 0.6, using `var(--muted)`), consistent with the existing card styles.

- [ ] **Step 1: Write the failing tests** in `src/pages/placeholder.test.tsx`

```tsx
import { describe, expect, it, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Article from './Article'
import IssueIndex from './IssueIndex'
import Home from './Home'
import { useMag } from '../store'

const at = (path: string, el: ReactNode) =>
  render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/group/:slug" element={el} /><Route path="*" element={el} /></Routes></MemoryRouter>)

beforeEach(() => useMag.setState({ hovered: null, chapter: 0, flyTo: null }))

describe('placeholder UI', () => {
  it('renders a placeholder as a coming-soon page', () => {
    at('/group/ati', <Article />)
    expect(screen.getByRole('heading', { level: 1, name: 'Ati' })).toBeInTheDocument()
    expect(screen.getByText(/This issue is still being prepared/)).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Chapters' })).toBeNull()
    expect(screen.getByText('Read a finished issue')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /T'boli/ })).toHaveAttribute('href', '/group/tboli')
  })
  it('a finished issue links to the next finished issue, wrapping', () => {
    at('/group/tboli', <Article />)
    expect(screen.getByRole('navigation', { name: 'Chapters' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ifugao/ })).toHaveAttribute('href', '/group/ifugao')
  })
  it('index marks placeholders as Coming soon under their island group', async () => {
    at('/issues', <IssueIndex />)
    await userEvent.click(screen.getByRole('button', { name: 'Visayas' }))
    const card = screen.getByRole('link', { name: /Ati/ })
    expect(within(card).getByText('Coming soon')).toBeInTheDocument()
    expect(card).toHaveAttribute('href', '/group/ati')
  })
  it('cover hint for a placeholder says Coming soon', () => {
    useMag.setState({ hovered: 'ati' })
    at('/', <Home />)
    expect(screen.getByText('Ati: Coming soon')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `npm test -- src/pages`
Expected: FAIL. The placeholder copy is missing, the TOC is still rendered, and the hint reads `Ati: `.

- [ ] **Step 3: Implement the behavior above in the listed files**

- [ ] **Step 4: Run all tests and the build**

Run: `npm test && npm run build`
Expected: all tests pass and the build succeeds.

- [ ] **Step 5: Manual check of the 3D parts** (`npm run dev`)

Expected: on the cover, the Aeta, Ati and Manobo markers are dimmer, don't pulse, and show "Coming soon" on hover. Clicking Ati flies in to the coming-soon page with the spirits object behind it. On T'boli, "Next issue" goes to Ifugao.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat: coming-soon placeholder issues on cover, index, article and map"
```

---

### Task 5: img2threejs one-line drop-in

**Files:**
- Create: `src/three/objects/fromFactory.tsx`, `src/three/objects/fromFactory.test.tsx`
- Modify: `src/three/objects/registry.ts` (doc comment only)

**Interfaces:**
- Produces: `export function fromFactory(factory: () => THREE.Object3D): ComponentType<{ color: string }>`. Each mounted instance calls `factory` exactly once (`useMemo`) and renders it via `<primitive object={...} />`. `color` is accepted and ignored, because img2threejs output carries its own materials. Registering becomes `bulul: fromFactory(createBulul)`.

- [ ] **Step 1: Install the renderer** with `npm i -D @react-three/test-renderer@^9.1.1`

- [ ] **Step 2: Write the failing test**

```tsx
import { describe, expect, it, vi } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import * as THREE from 'three'
import { fromFactory } from './fromFactory'

describe('fromFactory', () => {
  it('renders the factory output once per mount', async () => {
    const factory = vi.fn(() => { const g = new THREE.Group(); g.name = 'bulul'; return g })
    const Obj = fromFactory(factory)
    const r = await ReactThreeTestRenderer.create(<Obj color="#fff" />)
    await r.update(<Obj color="#000" />)
    expect(factory).toHaveBeenCalledTimes(1)
    expect(r.scene.findAll((n) => n.instance.name === 'bulul')).toHaveLength(1)
  })
})
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `npm test -- fromFactory`
Expected: FAIL. The module is not found.

- [ ] **Step 4: Implement `fromFactory`.** Then replace the hand-written wrapper example in `registry.ts`'s comment with `bulul: fromFactory(createBulul)`.

- [ ] **Step 5: Run all tests and confirm they pass**

Run: `npm test && npm run build`
Expected: all tests pass and the build succeeds.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: fromFactory wrapper for img2threejs objects"
```

---

### Task 6: Release check and first deploy

**Files:** none (verification + publishing)

- [ ] **Step 1: Local production check**

Run: `npm test && npm run build && npm run preview`
Expected: everything is green. In the preview, `#/group/ati` loads directly after a refresh, and there are no 404s in the DevTools Network tab.

- [ ] **Step 2: Mobile/fallback check.** In Chrome DevTools, use a mobile device with 4× CPU throttling. Expected: the cover stays usable, and the effects drop out on their own (`hq` false) if FPS sags.

- [ ] **Step 3: Publish. This step is outward-facing, so ask the user before running it.**
The user creates an empty GitHub repo and approves the push. Then run `git remote add origin <url> && git push -u origin main`. Next, in repo Settings → Pages, set the source to "GitHub Actions". Expected: the Deploy workflow passes its test and build steps, and `https://<user>.github.io/<repo>/#/group/ati` shows the coming-soon page.
