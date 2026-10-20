---
version: 1
slug: "src-pages-home-tsx"
primary_target: "src/pages/Home.tsx"
related_targets: ["src/pages/Article.tsx","src/pages/IssueIndex.tsx","src/pages/About.tsx","src/three/Stage.tsx"]
---

## Scope

The whole magazine: cover (`src/pages/Home.tsx`), issue pages, issue index, about, and the shared 3D stage. Mode: **Experience** for the cover and issue pages (the 3D work leads); the index and about follow the same system with Read restraint.

## Audience and job

Graders open the GitHub Pages link cold, on their own phone or laptop. Within the first screen they must see what Katutubo is (a 3D e-magazine on the Indigenous Peoples of the Philippines), be able to explore it without help, and leave having read at least one issue.

## Constraints

- The user pinned the references: animejs.com and felixrieseberg.com. Asked for it to look "simple and cool"; rejected two rolled hands, so this direction is user-pinned, not rolled.
- From the references the user chose: labelled exploded objects, a scroll-scrubbed story, objects as navigation. Must not feel cold or techy, and must stay easy to read.
- Keep the map zoom (the user's favourite part), every placeholder and draft behaviour, the tests, HashRouter, and reduced motion.

## Direction contract

THESIS: One continuous 3D scene carries the whole magazine, drawn like a technical illustration, with the information pinned to the object on leader lines, the way animejs.com explains its API. Refuses the glowing dark map with a serif masthead, and the photo-led culture-magazine grid.

OWN-WORLD: Two grounds that swap per section: warm charcoal #252321 and warm bone #dad5d0. The 3D is flat-shaded charcoal slabs with crisp edges on dark, and an outline drawing on bone. Red Hat Display for headings, Red Hat Text for body, Red Hat Mono only for data (coordinates, the ruler). One signal red #ff4b3e for the active mark. Each people's own colour appears only as their heading on dark ground and as a dot. No glow, no bloom, no gradients, no eyebrow labels.

STORY: The visitor sees the archipelago with six peoples named on leader lines, scrolls from the whole archipelago to Luzon, then Visayas, then Mindanao as the camera glides, opens an issue by clicking a label, island or number key, and reads chapters while that people's object explodes into its parts, with each chapter's key terms pinned around it.

FIRST VIEWPORT: Charcoal ground. Top left: the lowercase wordmark; nav on the right. Left column at about 30% width: H1 "The first peoples of the islands." about 72px, a two-line lede, then a primary "Start in the north" and a secondary "All issues". Centre right: the extruded archipelago, flat-shaded with edge lines, tilted and slowly following the pointer. Right edge: a column of six issue labels, each joined by an elbow leader line to its island marker. Bottom right: a dark rounded panel with the legend, a "1–6 open an issue" hint, and the tick ruler.

FORM: User-pinned reference system (animejs.com information grammar plus felixrieseberg.com objects-as-navigation), chosen after the roll's hands were rejected; not a position on the grounded list. seed:ab5eeb2855e78fdb

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Signature interaction and motion grammar

The camera glides between scroll sections, and the ground and ink tone cross-fade between charcoal and bone, damped. In an issue, the chapter object explodes apart as its chapter scrolls. Leader lines follow their anchors every frame. Under reduced motion, nothing drifts: the camera cuts and objects show already exploded.

## Unresolved

Bilingual EN/Filipino is not designed yet. Real img2threejs models will replace the procedural objects later.
