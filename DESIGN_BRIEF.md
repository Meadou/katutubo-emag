# Katutubo design brief

## The goal

When a grader opens the link, the page should feel alive, not like text on a page. As the reader scrolls, the world transforms around them: one continuous journey that moves from the archipelago, into a place, into a story, and then on to the next world. It should feel like a film you control with the scroll wheel or your thumb.

Take inspiration from:

- **animejs.com:** every idea is a short title, one plain sentence, and a live demo beside it. Information is shown, not just stated.
- **felixrieseberg.com:** one cohesive scene with a point of view, plus a lightweight static fallback for weak devices.

## Step 1: Choose a style (you decide)

Do not ask me. Pick ONE visual style, commit to it fully, and write a short rationale (5–8 lines) in `docs/DESIGN_DIRECTION.md` covering the choice, palette, type, motion language, and why it suits Katutubo. Consider these candidates, or propose your own if something fits better:

- **Woven-textile world.** Palette and geometry drawn from the weaving traditions of the communities featured (diamonds, zigzags, banded color). Transitions feel like thread being drawn across the screen.
- **Layered paper-cut landscape.** Parallax depth layers (sea, mountains, terraces, forest) in rich flat color with soft shadows. Each world is a different time of day.
- **Dusk-to-dawn illustrated journey.** One sky that moves through light as you scroll, with the land changing beneath it. Atmospheric, with fog and gradient skies.
- **Editorial magazine with kinetic type.** Big expressive typography, bold color blocks and cinematic cuts, with 3D used sparingly as hero moments.

Avoid generic dark-mode-with-neon and default-looking Three.js. It must look designed.

## Step 2: Scroll-driven world transitions

- Use one persistent 3D canvas (react-three-fiber) or a layered parallax stack that stays mounted while the page scrolls. Do not remount per section.
- Define a world state per chapter (sky/background colors, fog, light color and angle, camera position, accent color). Scroll progress interpolates between states smoothly.
- Suggested journey: archipelago map, fly in to the island/region, the community's landscape (Overview), then each chapter as its own mood (Myths & Stories, Music, Beliefs & Rituals, Crafts), ending at Sources.
- Pin or sticky each world while its text moves over it, with reveals that stagger in rather than all appearing at once.
- Use spring or exponential easing, never linear. One signature move (the map fly-in) should be done exceptionally well.
- Libraries are your choice: GSAP ScrollTrigger or Anime.js onScroll for DOM and SVG, drei ScrollControls or a custom scroll-progress hook for the 3D camera. Keep the bundle small.

## Step 3: Show, then tell (Anime.js pattern)

Every chapter pairs a short text block (title, one sentence, a few points) with something the reader can interact with:

- **Music:** tap or strike a gong and hear the synthesized pattern (keep the "synthesized" label).
- **Crafts:** a weave pattern that draws itself with SVG line drawing as you scroll.
- **Overview:** the map highlights the group's region.
- **Myths & Stories:** an illustrated scene that reveals in stages as each part of the story is read.

## Respect rules (non-negotiable)

- Sacred objects, rituals and spirits get stillness. No spinning, bouncing, particles or glow effects on them. Spectacle belongs to the landscape, the transitions, the typography and craft patterns.
- Never use sacred or ceremonial imagery as mere decoration.
- Do not invent facts, quotes, photos, recordings or endorsements. Keep draft markers, "Coming soon" placeholders and the synthesized-sound label.
- Endonyms first. Keep the Sources section on every issue.

## Reliability and performance

- First screen explains what Katutubo is and what to do next within about 5 seconds, with a clear "scroll to begin" cue.
- Must work on a mid-range phone: lazy-load 3D per chapter, compress textures, use a lighter mode on mobile or low-power devices, and auto-reduce effects if frame rate drops.
- No WebGL, or prefers-reduced-motion: serve a good static version of the same journey (illustrated sections with simple fades), with no camera drift. The stories must remain fully readable and reachable.
- Keep the keyboard and screen-reader route (cover list), WCAG AA text contrast, HashRouter deep links, and the content lint test passing.

## Scope for the deadline

- Build the full transformation on the Ifugao issue first, to a standard I'd be proud to show. Then reuse the system for Mangyan and T'boli.
- Replace at most one hero object with a high-quality model; leave the other procedural stand-ins.
- Leave bilingual support for later, but do not hard-code English strings in a way that makes it painful.
- Test on a real phone-sized viewport and with WebGL disabled before calling it done.

## Deliverables

- `docs/DESIGN_DIRECTION.md` (the style you chose and why)
- The scroll-driven world transitions implemented and deployed to GitHub Pages
- A short note of anything you changed in `PRODUCT.md` or anything you could not finish
