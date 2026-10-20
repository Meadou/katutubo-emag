# Design direction: Paper islands

**The choice: a layered paper-cut landscape, built from the real land.** Every island, ridge and terrace is cut from flat sheets of colored paper, one sheet per contour of real elevation data (public Terrain Tiles: SRTM, ETOPO1), stacked with soft shadows between them. Each chapter is a different time of day on the same land: morning for the Overview, dusk for the Myths, evening for the Music, a still night for Beliefs, dawn for the Crafts, and full day for the Sources.

**Why it suits Katutubo.** Ifugao terraces already *are* contour lines cut into a mountain, so the paper style turns the subject's own landscape into the medium. All the spectacle lives in the land, the light, the type and the transitions, which leaves sacred things free to stay still. It also avoids the weaving option, which would turn communities' designs (such as dream-given t'nalak patterns) into decoration. The same paper shapes render as plain SVG, so phones without WebGL and readers who prefer reduced motion get the same journey, flattened rather than replaced.

**Palette.**
- Each time of day is its own flat paper set: a two-stop sky, three to five land sheets from shore to summit, and one accent.
  - Morning: maize sky over terrace greens (#f2c879 → #fbe9c6; land #2f5d46, #4f7f55, #86a66a).
  - Dusk: coral into plum (#e98b6d → #5b3f6e; land #4a3d6e, #6e5784, #c38d92).
  - Evening: deep teal with a brass horizon (#14353b → #c98b4a).
  - Night: ink blue (#101a2c → #2a3b5a; land #24304c to #5e7093), with no stars that move.
  - Dawn: rose into pale blue (#f4b6a6 → #bcd4e6).
- Text always sits on cut paper cards in ink #1d1b17 on cream #f6efe2 (over 14:1), so contrast never depends on the sky behind it.

**Type.**
- **Young Serif** is the display face: heavy, warm and slightly soft, like letters cut from card.
- **Hanken Grotesk** is the text face. It was designed by the Filipino type designer Alfredo Marco Pradil, so the magazine reads in a face made at home.

**Motion language.**
- Sheets slide apart in parallax as the camera moves, eased exponentially and never linear. Text arrives strip by strip, staggered like paper sliding into place.
- The signature move: one paper map, zoomed. The journey starts on the whole archipelago, comes down to each island group at mid zoom, down to each people's land and back up, on one smooth pan-and-zoom path.
- Sacred objects, rituals and spirits never move. In Beliefs & Rituals even the camera stops drifting.

## What shipped

- **One map, nine peoples.** A single paper map of the archipelago (six contour sheets and Lake Lanao), zoomed in and out between nine stops: Kalinga, Ifugao, Bugkalot · Suludnon, Ati, Magahat · Maranao, T'boli, Sama Dilaut. Ifugao and T'boli carry their chapters; the others are "Coming soon". Stops sit at a distance where the map still reads as paper relief.
- **Loading screen.** Shown from the first paint (static HTML), it waits for the fonts, the map, every sheet built and the shaders compiled, so nothing stalls once the journey starts. It steps aside after 12 s whatever happens.
- **Performance.** Each map sheet is two draw calls (tops, cut edges), however many islands it holds; shadows are redrawn only when something that casts or frames them moves; the page is never re-styled from the root per frame. On an Intel UHD laptop the journey runs at about 45–60 fps.
- **Modes.** Live 3D in two tiers: *high* has shadow maps; *lite* is for touch-first or modest devices, and any device steps down to it when its frame rate falls. A device still under about 18 fps in the lite tier switches to the static journey (flat SVG paper), as do browsers without WebGL and readers who prefer reduced motion.
- **Objects.** The gong stand and the loom, simple paper stand-ins at map scale, rise in their chapters. Beliefs chapters are given stillness. More simple objects can come later.
- **Demos per chapter.** Region mini-map, a story in stages, interlocking flat gongs (Ifugao), bossed gongs (T'boli), a weave structure, and a still "Read slowly" card for Beliefs.

## Not finished

- Facts are still draft: both issues need checking against community, NCIP and academic sources; the other seven peoples are "Coming soon".
- No language switch yet (English only).
- The gong and loom are simple stand-ins, not finished models.
