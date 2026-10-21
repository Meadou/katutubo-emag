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
- Text is ink #1d1b17 on a soft cream scrim over the map, tuned (and tested) to hold at least 4.5:1 over the darkest land and sky, so contrast never depends on what is behind it.

**Type.**
- **Young Serif** is the display face: heavy, warm and slightly soft, like letters cut from card.
- **Hanken Grotesk** is the text face. It was designed by the Filipino type designer Alfredo Marco Pradil, so the magazine reads in a face made at home.

**Motion language.**
- Sheets slide apart in parallax as the camera moves, eased exponentially and never linear.
- Words never travel up the screen. Each section's words are held still in a frame over the map: they fade in place (a 16px slide) as the section begins, and fade away as the journey continues. A chapter's paragraphs step through in place, one at a time.
- The signature move: one paper map, zoomed. The journey starts on the whole archipelago, comes down to each island group at mid zoom, down to each people's land and back up, on one smooth pan-and-zoom path.
- Sacred objects, rituals and spirits never move. In Beliefs & Rituals even the camera stops drifting.

## Interface: the map is the hero

- **One idea per screen.** A heading, one sentence and the map. A people's stop shows their name, one line, and "Coming soon" or the draft note; an island group shows its name and its three peoples, named on the map itself.
- **One surface, two fonts.** Words sit on one scrim panel (radius 10px); the myths scene has a soft wash panel of its own. Young Serif for headings only; Hanken Grotesk at 400 and 600 for everything else. One hairline, one shadow. Italics only inside article text, where they mark words in other languages.
- **One accent per section.** The people's colour on their screens, the site's amber elsewhere; everything else is neutral.
- **One control.** The breadcrumb pill, "Katutubo / Ifugao ▾", with the sound switch at its end. Its menu lists the nine peoples by island group and the current people's chapters. Top left on a laptop, bottom centre on a phone.
- **Labels on the visual.** Names are attached to the map by thin leader lines: an island group's three peoples at their pins (each a link), a people's name and coordinates at their stop, and the chapter's object. Every term a label names comes from the chapter's own text (tested). Beliefs chapters have no labels.
- **Demos on the 3D models.** Tap a 3D gong to hear it; its label plays the interlocking pattern. The loom weaves row by row as the Crafts chapter is read ("structure only, not a community design"). The myths play out in stages in a side panel. Without the 3D, the flat gongs and the drawn weave sit beside the chapter.
- **Phones are recomposed.** A chapter's heading and sentence at the top, the land and its object in the middle, the paragraph being read just above the pill. One label at most.

## What shipped

- **One map, nine peoples.** A single paper map of the archipelago (six contour sheets and Lake Lanao), zoomed in and out between nine stops: Kalinga, Ifugao, Bugkalot · Suludnon, Ati, Magahat · Maranao, T'boli, Sama Dilaut. Ifugao and T'boli carry their chapters; the others are "Coming soon". Stops sit at a distance where the map still reads as paper relief.
- **Loading screen.** Shown from the first paint (static HTML), it waits for the fonts, the map, every sheet built and the shaders compiled, so nothing stalls once the journey starts. It steps aside after 12 s whatever happens.
- **Performance.** Each map sheet is two draw calls (tops, cut edges), however many islands it holds; shadows are redrawn only when something that casts or frames them moves; the page is never re-styled from the root per frame. On an Intel UHD laptop the journey runs at about 45–60 fps.
- **Modes.** Live 3D in two tiers: *high* has shadow maps; *lite* is for touch-first or modest devices, and any device steps down to it when its frame rate falls. A device still under about 18 fps in the lite tier switches to the static journey (flat SVG paper), as do browsers without WebGL and readers who prefer reduced motion.
- **Objects.** The gong stand and the loom, simple paper stand-ins at map scale, rise in their chapters. Beliefs chapters are given stillness. More simple objects can come later.
- **Demos.** Playable 3D gongs (flat gangsa for Ifugao, bossed klintang for T'boli), the 3D loom weaving as you read, and the myths in stages. The region mini-map and the "Read slowly" card were removed: the map itself shows where each people lives, and the Beliefs text is on screen in full.

## Not finished

- Facts are still draft: both issues need checking against community, NCIP and academic sources; the other seven peoples are "Coming soon".
- No language switch yet (English only).
- The gong and loom are simple stand-ins, not finished models.
