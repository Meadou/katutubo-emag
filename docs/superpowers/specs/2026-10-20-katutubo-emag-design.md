# Plan: "Katutubo" — 3D E-Magazine on Philippine Indigenous Peoples

## Context
The user wants an interactive, visually striking e-magazine that showcases the Indigenous Peoples (IP groups) of the Philippines: their stories, myths, music, beliefs and crafts, so Filipinos can appreciate them. Constraints: pure static code (no database, no backend), Three.js for 3D (via React Three Fiber), img2threejs for converting reference images into 3D objects later, deployable just by pushing to GitHub (GitHub Pages). No images exist yet, so we start with procedural/placeholder 3D and swap in img2threejs objects later.

New project folder (empty, nothing to reuse): `C:\Users\mary ann pamilar\katutubo-emag` (name changeable).

## Stack
- **Vite + React + TypeScript**
- **@react-three/fiber**, **@react-three/drei** (camera controls, scroll, Html, loaders, PerformanceMonitor, AdaptiveDpr), **@react-three/postprocessing** (bloom, vignette, noise)
- **GSAP** (ScrollTrigger) or **framer-motion** for scroll/page transitions
- **react-router-dom** using `HashRouter` (avoids GitHub Pages 404 on refresh of deep links)
- Content as **MDX/Markdown files** bundled at build time (no DB) via `@mdx-js/rollup`

## Structure
```
katutubo-emag/
  index.html
  vite.config.ts            # base: '/katutubo-emag/' for Pages
  .github/workflows/deploy.yml   # build + actions/deploy-pages
  public/audio/ public/img/       # small, compressed, properly licensed
  src/
    main.tsx, App.tsx       # router, layout, loader screen
    content/groups/         # one .mdx per group + frontmatter (name, region, island, coords, color, motif)
      ifugao.mdx, tboli.mdx, mangyan.mdx   # starter issues (3)
    content/index.ts        # import.meta.glob → typed list of groups
    three/
      scenes/ArchipelagoScene.tsx  # home hero: stylized PH islands + glowing markers per group
      scenes/GroupScene.tsx        # per-article background scene, themed by group color/motif
      objects/                     # procedural placeholders now (Gong, Salakot, Loom, RiceTerrace);
                                   # img2threejs outputs dropped in here later (same factory signature)
      effects/Post.tsx             # bloom/vignette/grain, disabled on low-perf
      shaders/WeavePattern.ts      # textile-pattern shader (e.g., T'nalak-inspired)
    components/
      Article/ (Hero, Section, PullQuote, MythCard, MusicPlayer w/ audio visualizer, Sources)
      Nav, IssueIndex, Loader, NoWebGLFallback
    styles/                 # typography-led magazine design
```

## Key experiences
1. **Cover / Home**: 3D archipelago (island outlines from a simplified SVG via drei/SVGLoader, extruded, slow camera drift). Hover a marker for the group name; click to fly the camera in and route to the article.
2. **Article ("issue") pages**: scroll-driven chapters: Overview → Myths & Stories → Music → Beliefs & Rituals → Crafts → Sources. The 3D object for each chapter (gong, loom, terraces) animates with scroll (drei `ScrollControls` or GSAP).
3. **Music**: Web Audio API analyser drives a 3D visualizer (e.g., kulintang gongs pulsing). Use only clips with clear permission/licensing.
4. **Index**: grid of all groups, filterable by island group (Luzon/Visayas/Mindanao).

## img2threejs workflow (later, when images exist)
- Install the skill: clone `github.com/img2threejs/img2threejs` into `~/.claude/skills/`; needs Python 3.10+.
- Run it per object at dev time. It outputs a factory returning `THREE.Group`. Save it to `src/three/objects/`, wrap it in a small R3F component (`<primitive object={useMemo(factory)} />`), and replace the placeholder.
- Each object costs about 80k–180k tokens. Choose single, clearly shaped artifacts (instruments, tools, headgear, houses).

## Performance & accessibility
- Lazy-load scenes per route (`React.lazy`), `<Suspense>` with a styled loader
- drei `PerformanceMonitor` + `AdaptiveDpr`; drop postprocessing on low FPS/mobile
- Respect `prefers-reduced-motion`; fall back to static images when there is no WebGL
- Keep the site well under GitHub Pages limits (1 GB site, 100 MB/file); compress audio/images

## Content & cultural respect
- I'll write short starter drafts for 3 groups, marked **"verify"**. The user should check facts against NCIP, academic sources or community sources, and every article has a Sources section.
- Use the groups' own names (endonyms). Avoid presenting sacred rituals or objects as decoration. Credit the creators of photos, music and stories.

## Deployment
- `vite.config.ts` `base: '/<repo-name>/'`
- GitHub Action: on push to `main` → `npm ci && npm run build` → `actions/upload-pages-artifact` → `actions/deploy-pages`. Set the repo's Pages source to "GitHub Actions".

## Verification
- `npm run dev`: click through the cover, a marker fly-in, an article's scroll chapters and the music visualizer
- `npm run build && npm run preview`: confirm the base path works and there are no 404 assets
- Test on a phone or with Chrome DevTools mobile throttling for FPS and the fallback
- After the first push: confirm the Action succeeds and the live `https://<user>.github.io/<repo>/` loads, including deep links (`#/group/ifugao`)

## Phase 2 decisions (2026-10-20)
- v1 above is built. Phase 2 adds: version control + automated tests, **placeholder issues** so the magazine covers **Luzon, Visayas and Mindanao**, and a one-line drop-in path for img2threejs objects.
- Placeholders are *not* full articles: name, region, island, coordinates and color only. No facts, myths or taglines are written for them yet ("do not put everything yet, just placeholders").
- A placeholder still appears on the map, the cover list and the index (marked "Coming soon") and opens a short "coming soon" page. The "Next issue" link only ever points to a finished issue.
