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
- The signature move: the camera dives from the whole archipelago through banks of paper cloud into the Cordillera at sunrise, and the map's coarse sheets give way to the finer ones behind the clouds.
- Sacred objects, rituals and spirits never move. In Beliefs & Rituals even the camera stops drifting.

## What shipped

- **Modes.** Live 3D in two tiers: *high* has shadow maps and full resolution; *lite* is for touch-first or modest devices, and any device steps down to it when its frame rate falls. A device still under about 18 fps in the lite tier switches to the static journey for the rest of the visit. The static journey (no WebGL, reduced motion, or too slow) draws the same worlds as flat SVG paper.
- **Light.** The palettes give each time of day its colour. The sky light is a pale tint of the whole sky, so dusk, evening and night stay readable instead of sinking to black.
- **Demos per chapter.** Region mini-map, a story in stages, the seven-syllable line (Mangyan), interlocking flat gongs (Ifugao), bossed gongs (T'boli), a plucked two-string lute (Mangyan, no gongs), a weave structure, and a still "Read slowly" card for Beliefs. When a Beliefs chapter names key terms, the card shows the sentence each term comes from. When it names none (Mangyan, T'boli), it reads the chapter one sentence at a time.

## Notes for PRODUCT.md

Updated to match the build. Every rule (respect, honesty, accessibility) is unchanged.
- Reduced motion now serves the static paper journey rather than "no camera drift, instant fly-in" in 3D.
- "Spirits" is no longer an animated 3D object. Beliefs chapters are given stillness.
- The 3D objects live in `src/stage/props/`; the terraces are the one hero model.
- Interface strings are in `src/i18n/en.ts`, which is ready for a Filipino file.

## Not finished

- Facts are still draft: all three issues need checking against community, NCIP and academic sources.
- No language switch yet (English only).
- Gong, bamboo and loom are simple paper stand-ins, not finished models.
- On a CPU throttled 4× at phone size, the fly-in runs at about 15–25 fps while the region's sheets are built; it stays in 3D (lite tier), above the static cutoff.
