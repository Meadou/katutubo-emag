# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary: graders of a school project.** Katutubo is the creator's school project. Teachers or panelists evaluate it by opening the published GitHub Pages link on their own phones or computers, with no guided demo. The site has to make its case unaided, on whatever device and browser a grader happens to use.
- **The audience the magazine is written for:** Filipinos who want to know and value the Indigenous Peoples of the Philippines (from the About page: "so that more Filipinos can know and value them").

## Product Purpose

An interactive e-magazine. Each "issue" introduces one Indigenous People of the Philippines through chapters: Overview, Myths & Stories, Music, Beliefs & Rituals, Crafts, and Sources. Readers reach issues from a 3D map of the archipelago, the cover list, or the index, which can be filtered by Luzon, Visayas and Mindanao.

Success means a grader who opens the link cold understands what Katutubo is, can explore it without help, and comes away seeing both the craft and the respect for the subject.

## Positioning

It's a magazine you move through, not a reference page. A paper-cut 3D archipelago, built from real elevation data, carries the reader from place to story, with a few per-chapter paper objects (terraces, gongs, bamboo, looms). Beliefs & Rituals chapters get stillness instead of an object. Respect for living communities is built into the format: endonyms, a Sources section on every issue, draft markers on unverified text, and "Coming soon" placeholders rather than invented content.

## Operating Context

- Graders open a shared URL (`https://<user>.github.io/<repo>/`, HashRouter deep links like `#/group/ifugao`) on unknown devices. Phones are as likely as laptops. WebGL may be missing or slow, so the no-WebGL fallback and automatic effect reduction matter.
- Deadline: **soon** (within a few weeks; the exact date and rubric were not given). Polish and reliability come before new features.

## Capabilities and Constraints

- Static site: Vite + React + TypeScript, react-three-fiber/drei, deployed to GitHub Pages by GitHub Actions. No backend, no database, no tracking.
- Content is Markdown in `src/content/groups/*.md`. Placeholder issues (`placeholder: true`) appear everywhere but publish no body. A content lint test guards every file.
- Nine peoples, three per island group, visited north to south in one journey: Kalinga, Ifugao, Bugkalot (Luzon); Suludnon, Ati, Magahat (Visayas); Maranao, T'boli, Sama Dilaut (Mindanao). Ifugao and T'boli are draft articles; the other seven are placeholders.
- **Language: bilingual English / Filipino is the goal**, eventually with a language switch. The site is English-only today. Every interface string is in `src/i18n/en.ts`, so a Filipino edition is one more file with the same keys; the switch itself is not built yet.
- The 3D is one paper map of the archipelago (with Lake Lanao), zoomed in and out; there is no separate detailed terrain per place. A loading screen prepares the map and its shaders first, so the journey runs smoothly on laptops with integrated graphics. The gong stand and the loom are simple paper stand-ins at map scale; the detailed terraced mountain was removed for performance. More simple objects can come later (`fromFactory` in `src/stage/props/` takes img2threejs models).
- Sound: in-browser synthesized gong patterns in the Music demos, labelled *synthesized*, and a synthesized wind-and-water ambience. The nav's switch is the one sound control; turning it on says the sound is synthesized. Real recordings only with clear permission.
- **Open decision: content sourcing.** The user hasn't decided between published sources only (NCIP, NCCA, academic, museums) and direct community contact and review.

## Brand Commitments

- Name: **Katutubo** ("native" or "indigenous"). Masthead line: "the first peoples of the islands". Framed as "Issue 01 · An e-magazine".
- Voice: plain, warm and respectful (see `src/pages/About.tsx`). It invites correction from community members.
- Reference sites named by the user as inspiration, in their words: "i want to use inspiration from other websites check it: https://animejs.com/ and https://felixrieseberg.com/?ref=landing.love#work — i like how anime js gives information".

## Evidence on Hand

- Two draft articles (`ifugao.md`, `tboli.md`), marked `draft: true` and still needing fact-checking against community, NCIP and academic sources. A Mangyan draft, out of the current scope, is kept in `docs/research/mangyan.md`.
- No photographs, licensed recordings, community quotes or reviewer endorsements exist yet. `public/audio/` is empty. Future work must not fabricate any of these, and must not write facts, myths or taglines for placeholder groups.

## Product Principles

1. **Respect before spectacle.** Living cultures are not decoration. Sacred objects and rituals are never used as ornament, endonyms come first, and every claim has a source.
2. **Self-explaining.** A grader with no presenter must understand what this is and how to explore it within the first screen.
3. **Works on whatever opens it.** Phone, laptop, slow GPU or no WebGL: the stories stay reachable, and the 3D enhances the content rather than gating it.
4. **Honest about what's unfinished.** Drafts are marked, placeholders say "Coming soon", and synthesized sound is labelled.
5. **Reliability over reach while the deadline is near.** Finish and polish what exists before adding features.

## Accessibility & Inclusion

- `prefers-reduced-motion` is respected: the reader gets the static paper journey (the same sections drawn as flat SVG, simple fades, no camera drift, no fly-in). Browsers without WebGL, and devices too slow even for the lighter 3D tier, get the same.
- Every 3D marker has a keyboard and screen-reader route: the journey rail, on screen from the first view and next in Tab order after the opening card.
- New UI keeps text at WCAG AA contrast. This is enforced for placeholder styles by a test.
- Bilingual EN/Filipino is a stated inclusion goal.
