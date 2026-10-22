# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary: graders of a school project.** Katutubo is a group's school project, graded against a written rubric: "E-Magazine: Myths, Stories, and Music of ICCs/IPs in the Davao Region" (accuracy 20, comparative analysis 20, cultural significance 20, organization 15, digital presentation 15, sources and cultural respect 10). Teachers open the published GitHub Pages link on their own phones or computers, with no guided demo. The site has to make its case unaided, on whatever device and browser a grader happens to use.
- **The group (cover credits, in order):** Krizia Faye Amon, Marjhun Kyle Pamilar, Junrey Ryan Aurelio, Godwin Leonard, Vincent Anonuevo, Joshua Algene Bontuyan.
- **The audience the magazine is written for:** Filipinos who want to know and value the Indigenous Peoples of the Philippines (from the About page: "so that more Filipinos can know and value them").

## Product Purpose

An interactive e-magazine that explores and compares the myths, stories and music of ten Indigenous Cultural Communities / Indigenous Peoples (ICCs/IPs) of the Davao Region, two from each of its five provinces. It follows the rubric's suggested contents, in order: a cover (title, group members, the instruments compared), an introduction with the contents of the issue, the peoples province by province (each with Myths & Stories and Music), a comparison across all ten (theme by theme on the map, a full table, and "compare any two"), cultural significance, a conclusion, respect and protocols, and references. Readers move through it on the 3D map, the breadcrumb pill's menu, or the index of peoples, filterable by province.

Success means a grader who opens the link cold understands what Katutubo is, can explore it without help, and comes away seeing both the craft and the respect for the subject.

## Positioning

It's a magazine you move through, not a reference page. A paper-cut 3D archipelago, built from real elevation data, carries the reader from place to story, with a few per-chapter paper objects (terraces, gongs, bamboo, looms). Beliefs & Rituals chapters get stillness instead of an object. Respect for living communities is built into the format: endonyms, a Sources section on every issue, draft markers on unverified text, and "Coming soon" placeholders rather than invented content.

## Operating Context

- Graders open a shared URL (`https://<user>.github.io/<repo>/`, HashRouter deep links like `#/group/ifugao`) on unknown devices. Phones are as likely as laptops. WebGL may be missing or slow, so the no-WebGL fallback and automatic effect reduction matter.
- Deadline: **soon** (within a few weeks; the exact date and rubric were not given). Polish and reliability come before new features.

## Capabilities and Constraints

- Static site: Vite + React + TypeScript, react-three-fiber/drei, deployed to GitHub Pages by GitHub Actions. No backend, no database, no tracking.
- Content is Markdown in `src/content/groups/*.md`. Placeholder issues (`placeholder: true`) appear everywhere but publish no body. A content lint test guards every file.
- Ten peoples, two per province, visited around the Davao Gulf: Ata Manobo, Sama (Davao del Norte); Mansaka, Dibabawon (Davao de Oro); Mandaya, Kagan (Davao Oriental); Tagakaulo, Sangil (Davao Occidental); Bagobo-Tagabawa, B'laan (Davao del Sur). All ten are placeholders while their articles are researched. Sama, Sangil, Dibabawon and Kagan say "Information unavailable for now": almost nothing on their myths and music was found in published sources, and the group will research them itself. The comparison is across all ten, not province by province. The old Ifugao and T'boli drafts are kept in `docs/research/`.
- **Language: bilingual English / Filipino is the goal**, eventually with a language switch. The site is English-only today. Every interface string is in `src/i18n/en.ts`, so a Filipino edition is one more file with the same keys; the switch itself is not built yet.
- The 3D is one paper map, cut along real boundaries (geoBoundaries / NAMRIA, PSA, OCHA, CC BY 3.0 IGO): the country's 17 regions as separate pieces with a groove of sea between them, and the Davao Region as six pieces of its own (five provinces and Davao City), baked at four times the detail. The cover shows the whole country with the Davao Region in colour; a choreographed descent through paper clouds comes down onto the Davao Gulf, where the region parts into its provinces; the camera then circles the gulf province by province; the conclusion pulls back out to the whole country. A loading screen prepares the map and its shaders first, so the journey runs smoothly on laptops with integrated graphics. The gong stand and the loom are simple paper stand-ins at map scale; the detailed terraced mountain was removed for performance. More simple objects can come later (`fromFactory` in `src/stage/props/` takes img2threejs models).
- Sound: in-browser synthesized gongs, labelled *synthesized*, and a synthesized wind-and-water ambience. In the Music chapters the reader taps the 3D gongs, or plays the pattern from the gongs' label; without the 3D, flat gongs sit beside the chapter. The breadcrumb pill's switch is the one sound control; turning it on says the sound is synthesized. Real recordings only with clear permission.
- **Content sourcing: published sources only** (decided 2026-10-22). No interviews were done; the magazine says so, credits the community co-authored sources and the tradition-bearers named in published texts, and reproduces no sacred chants, prayers or recordings.

## Brand Commitments

- Name: **Katutubo** ("native" or "indigenous"). Masthead line: "the first peoples of the islands". Framed as "Issue 01 · An e-magazine".
- Voice: plain, warm and respectful (see `src/pages/About.tsx`). It invites correction from community members.
- Reference sites named by the user as inspiration, in their words: "i want to use inspiration from other websites check it: https://animejs.com/ and https://felixrieseberg.com/?ref=landing.love#work — i like how anime js gives information".

## Evidence on Hand

- Research notes in `docs/research/` (a Manobo/Matigsalug note with sources; the old Ifugao, T'boli and Mangyan drafts, out of the current scope). Strongest shared sources for the Davao peoples: Cole (1913) *The Wild Tribes of Davao District* (Bagobo, Bila-an, Tagakaolo, Ata, Mandaya), Benedict (1916) on Bagobo myth and ceremony, Brandeis (2019) on Philippine boat lutes, Fuentes (1980) *A Treasury of Mandaya and Mansaka Folk Literature*.
- No photographs, licensed recordings, community quotes or reviewer endorsements exist yet. `public/audio/` is empty. Future work must not fabricate any of these, and must not write facts, myths or taglines for placeholder groups.

## Product Principles

1. **Respect before spectacle.** Living cultures are not decoration. Sacred objects and rituals are never used as ornament, endonyms come first, and every claim has a source.
2. **Self-explaining.** A grader with no presenter must understand what this is and how to explore it within the first screen.
3. **Works on whatever opens it.** Phone, laptop, slow GPU or no WebGL: the stories stay reachable, and the 3D enhances the content rather than gating it.
4. **Honest about what's unfinished.** Drafts are marked, placeholders say "Coming soon", and synthesized sound is labelled.
5. **Reliability over reach while the deadline is near.** Finish and polish what exists before adding features.

## Accessibility & Inclusion

- `prefers-reduced-motion` is respected: the reader gets the static paper journey (the same sections drawn as flat SVG, the words in the page as ordinary text, no fades, no camera drift). Browsers without WebGL, and devices too slow even for the lighter 3D tier, get the same.
- Every 3D marker has a keyboard and screen-reader route: the breadcrumb pill ("Katutubo / Ifugao ▾"), first in Tab order, opens onto all nine peoples and the current people's chapters; a choice moves focus to that section's heading. The Tab key reaches only the words in sight, then the labels on the map (the gongs' "Play the pattern" among them). Every word of every section stays in the page for screen readers.
- New UI keeps text at WCAG AA contrast. This is enforced for placeholder styles by a test.
- Bilingual EN/Filipino is a stated inclusion goal.
