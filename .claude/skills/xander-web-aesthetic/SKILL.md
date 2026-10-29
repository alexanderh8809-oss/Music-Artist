---
name: xander-web-aesthetic
description: The design standard for Xander Hudson's website (this repo). Use it before any visual change to the site, whether that's a new page, section, animation, 3D effect, color, font, layout, image or merch display, and whenever he asks to make something "more aesthetic", "cooler", "more unique", "less basic" or "more like the vision". It covers the color and type system with measured contrast, layout rules, the motion and 3D toolkit with a performance budget, the signature objects that make the site his, lessons from other artists' sites, and a pre-ship checklist. Read DESIGN-BRIEF.md in the repo root for the current plan.
---

# Xander Hudson: web aesthetic

The site should feel like walking into one specific New York world at golden hour. It should not read as a template with his name on it. Every choice has to pass three questions:

1. **Is it his?** Does it come from his songs, his city or his objects (postcards, receipts, elevators, a guitar, the ox), or is it a trend borrowed from someone else?
2. **Is it light?** Does it hold 60fps on a mid-range phone and stay inside the budget below?
3. **Does it hold back?** Accent color is a hit, not a wash. There's one "wow" per screen, and the content does the rest.

If a choice fails any of the three, change it or cut it.

The brand rules live in the `xander-hudson-brand-manager` skill. Those rules win over this file on anything about story, tone, palette meaning or the mascot. Its rule on personal, sensitive subjects applies here too: they never become design material.

---

## 1. Lessons from other artists' sites (studied October 2026)

| Site | What works | What to take | What NOT to copy |
|---|---|---|---|
| **Paul McCartney** | A handwritten wordmark on a deep maroon block. The homepage is taken over by the current album's collage art. A decade-by-decade **Timeline** sits right on the homepage. | The site changes with each era. Treat the life story as a feature, like his Journey page. | A news-portal layout with many equal-weight tiles. |
| **Billie Eilish** | Redirects to the store. A hard boxed grid, one blue chip of color, and a symbol (the "blohsh") that does the branding everywhere. | **One symbol used everywhere.** For Xander that's the ox. | Store-first. He's early, so the music and the story come first. |
| **Laufey** | A script wordmark over a sparkling night sky. The homepage is **one object**: a clock face whose numerals are the album's 14 tracks, each linking to free sheet music. | **Make the homepage one meaningful object from the music**, and give fans a real gift (sheet music, tabs, lyrics). | Starry-night romance. That's her world, not his. |
| **Mitski** | Lilac paper, ink stamps, postmarks, handwriting curving around the page, a torn-paper edge, and an engraved illustration. | Confidence that paper texture can carry a whole site. | ⚠️ **Closest to us.** Torn paper, stamps and script are her look right now. Xander's paper has to stay *his*: NYC receipts, transit tickets, polaroids, Polaroid-era grain, verdigris and sunset. No lilac, no wax-seal stamps, no engraved castles. |
| **Clairo** | Almost nothing: one flat olive field and wide-spaced nav. | Restraint. A single color field can be a mood. | A blank, empty-feeling homepage. |
| **Daniel Caesar** | Default Times type, a plain text list, numbered links "(1)…(6)". | Raw typography can feel personal, and numbering gives a page rhythm. | Brutalism for its own sake. |
| **Charli XCX, *brat*** | A microsite where fans made their own covers. It went viral because it was simple. | **One playful tool fans can make something with and share.** | Lime green, or the meme format itself. |

The pattern across the best ones is that each site is a single world built from one era's objects, with almost no generic UI. The weak spots are cookie walls, store-first pages and news tiles.

---

## 2. Color

The palette already in `css/style.css`. Verdigris is the copper patina of the Statue of Liberty and sunset is the light on the Hudson, so the palette itself says New York.

| Token | Hex | Role | Share of a screen |
|---|---|---|---|
| `--ink` | #131417 | Base: night, ink, shadow | ~65% |
| `--ink-2` / `--ink-3` | #1c1e23 / #2a2d33 | Raised surfaces, lines | ~10% |
| `--bone` | #f2ece2 | Paper, main text | ~15–20% |
| `--bone-dim` | #b9b3a9 | Secondary text | small |
| `--sunset` | #ff6a3d | **The one action per screen** (Join), plus sky light | ≤5% |
| `--verdigris` | #2bb8a3 | Focus, active state, second action, patina details | ≤5% |
| `--peach` | #eac392 | Warm light on photos and paper | trace |

**Measured contrast** (WCAG AA needs 4.5:1 for body text and 3:1 for large text):

- Bone on ink: 15.7 ✅. Bone-dim on ink: 8.8 ✅. Verdigris on ink: 7.4 ✅. Sunset on ink: 6.5 ✅.
- **Ink text on sunset buttons: 6.5 ✅. Bone/white text on sunset: 2.4 ❌, never do it.**
- Verdigris on bone paper: 2.1 ❌. On light paper use **deep verdigris #17695e (5.6 ✅)**.
- Marker red #c9302c on paper: 4.7 ✅.
- `--cobalt` and `--dusk` on ink: 3.6. Use them for big shapes and illustration only, never for text.

**Rules**
- Dark-dominant, sitting in the middle zone. Accents stay saturated but small.
- Never put sunset and verdigris side by side as two big equal blocks. That reads as a sports team.
- Sunset is allowed in only two places: the primary button, and actual light (sky, glow, a lamp).
- Gradients only for light: a sunset sky, a window glow. No decorative mesh blobs.
- Photos get warmed (a slight sepia or peach lift) so they sit inside the palette.

---

## 3. Type

The brand allows **3 fonts max**:

| Role | Font | Use |
|---|---|---|
| Display serif | **Young Serif** | Wordmark, headings, newspaper headlines and body, prices. Heavy, warm, literary, and not one of the overused "AI site" serifs (Instrument Serif, Fraunces, Playfair). |
| Script accent | **Mynerve** (as "XH Hand") | Real pen handwriting for lyric lines, captions, postcard backs and notes. Never a headline. Loaded in `css/style.css` with `size-adjust: 120%`. Swapped in Oct 28, 2026 because Homemade Apple was too hard to read. |
| Grotesque | **Archivo** (variable width) | Body text at normal width. Labels, buttons, tickets and the subway line at `font-stretch: 62%`, uppercase, .12–.16em tracking. That one family covers both jobs. |

Chosen on Oct 28, 2026 after a side-by-side test against DM Serif Display, Bodoni Moda, Rozha One, Gloock, Mrs Saint Delafield, La Belle Aurore and Nothing You Could Do. One Google Fonts request loads all three.

- The display sizes are big and tight: `clamp(44px, 12vw, 128px)`, line-height .9–.95, slight negative tracking.
- Body text: 16–18px, line-height 1.5–1.6, at most 65 characters per line.
- A script line appears **at most once per screen**.
- Load only the weights you use, with `display=swap`. Preload the hero photo, not fonts.

---

## 4. Layout and composition

- **Mobile-first.** Design at 390px, then let it breathe wider. Most fans arrive from TikTok on a phone.
- **Asymmetry over centering.** Crop photos off an edge, hang type off a grid line, tilt paper 1–5°. A centered stack is the generic default to avoid.
- **One focal point per screen.** If two things compete, one becomes smaller, darker or paper-behind.
- **Real objects, not cards.** Content sits on things from his world: polaroids, postcards, receipts, tickets, a corkboard, an elevator panel. Rounded rectangles with drop shadows are the template look.
- **Depth through layering.** Back to front: wall or sky, then paper scraps, then the main photo, then a note, then the pin or tape. Each layer is a little lighter and casts a softer shadow.
- **Spacing scale:** 4, 8, 12, 16, 24, 32, 48, 72, 112. Sections get at least 72px of air on phones.
- The mailing-list action is visible on the first screen of every page, as the brand requires.

---

## 5. Motion and 3D toolkit

The motion should feel like a camera and like light: slow eases, physical weight. Nothing bounces or flashes like UI.

**Easing:** `cubic-bezier(.22,.61,.36,1)` for entrances, and ease-in-out cubic for camera moves. Durations run 300–700ms for UI and 900–1400ms for scene changes.

**From cheapest to most expensive. Always reach for the cheapest one that works.**

1. **CSS transitions on `transform` and `opacity` only.** These are compositor-only and essentially free.
2. **Scroll-driven CSS** (`animation-timeline: view()`). Chrome and Safari support it, but Firefox doesn't by default yet, so wrap it in `@supports (animation-timeline: view())` and make the static version look finished on its own.
3. **IntersectionObserver reveals**, used once per element, then disconnect.
4. **CSS 3D** (`perspective` + `transform-style: preserve-3d`). Fine for a handful of planes: a postcard that flips, a spinner rack, layered skyline depth, an elevator door. **Move one camera container rather than many objects.** The Journey page already does this.
5. **Pointer tilt** on desktop only (`@media (hover: hover) and (pointer: fine)`): at most ±6°, smoothed in rAF, and reset when the pointer leaves.
6. **Cross-page View Transitions** (`@view-transition { navigation: auto; }`) in Chrome 126+ and Safari 18.2+. Firefox simply loads the page normally, which is fine.
7. **WebGL**, at most **one** piece on the whole site and only if it carries meaning (for example, a sunset sky shader behind the hero). Load it lazily after the page is interactive, cap pixel ratio at 1.5, pause it when offscreen or the tab is hidden, and always have a CSS gradient fallback. Never load the full Three.js on the home page.

**Hard rules**
- Animate only `transform` and `opacity`. Keep `filter`, `box-shadow`, `clip-path` and `backdrop-filter` static. Changing them every frame causes repaints.
- No scroll listeners that read layout every frame. Read once, cache, and use rAF.
- `prefers-reduced-motion: reduce` turns off every camera move, parallax, tilt and auto-transition. The content must still be complete.
- No autoplay audio, ever. No sound toggles either: songs play in Spotify's own player on the home page when the visitor presses play there (the record is relabelled with whatever's playing), and the TikTok plays with sound because it's opened by a tap. Video autoplays only muted, only short ambient loops, and never on phones on cellular data if that can be avoided.
- ⚠️ **Don't use `loading="lazy"` inside a transformed camera** (the Journey world). The browser never sees those images scroll in, so they never load. This broke behind-the-stage photos on Oct 28, 2026.
- Paper grain uses the tiny inline `feTurbulence` SVG data-URIs in `css/journey.css` (under 1KB, no request), kept at subtle opacity.

---

## 6. Performance budget (per page, on a mid-range phone over 4G)

- **LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1** (the Core Web Vitals "good" thresholds, judged at the 75th percentile of real visits).
- Our own JS: **≤ 60KB** uncompressed per page, not counting the one optional WebGL piece.
- Images: **≤ 300KB each**, **≤ 2000px** on the long edge, JPG at quality 80 for photos, `width` and `height` set to prevent layout shift. Convert iPhone HEIC to JPG. Compress big PNG screenshots to JPG. (`sips -s format jpeg -s formatOptions 80 -Z 2000 in --out out.jpg` works on this Mac.)
- Video: H.264 MP4, 720p, under 15MB, with `preload="metadata"` and a poster image. Use YouTube for anything long.
- Fonts: at most 3 families, and only the weights actually used.
- No frameworks or build step. Static HTML/CSS/JS, as the repo already is.

---

## 7. Signature objects: the things that make it his

Use these before inventing new decoration. Each one comes from his songs or his city.

- **The elevator.** Real place, rule 6, and the song "Elevator Girl". It can serve as the nav or progress indicator (a brass floor dial or amber LED floor numbers) and as page transitions (doors closing and opening).
- **Postcards.** Each early song is a postcard with an image, a place and a date. Postcards flip in 3D to show a handwritten back.
- **Receipts and tickets.** "no receipts required" (from "Leave"). Use them for shows, prices and small print.
- **The corkboard with red string.** The Journey page. Polaroids, pins, newspaper.
- **The ox.** The mascot, with its asymmetric horns, flopped ear and cowlick, and the note tucked in its pocket. Use it as the one recurring symbol, the way Billie uses hers: the favicon, the end of the Journey, the sign-up confirmation, the 404 page. Use his real ox artwork. Never draw a stand-in that changes its design.
- **The quiet double.** A reflection or mirror. Use it **once** on the site, at a key moment (for example, the hero photo's reflection in a window that drifts a beat behind on scroll).
- **New York light.** A sunset sky, a single warm lamp, window glow, verdigris copper.

---

## 8. Anti-patterns (instant rejects)

- A dark centered hero with just a name and buttons (the template look; the current home page is close to this).
- Glassmorphism, neon glows, gradient mesh blobs, custom cursor trails, typewriter text, confetti.
- Parallax on everything. Depth belongs to one scene, not every section.
- More than one script line per screen, or a script headline.
- Orange used for decoration, or more than one orange button on a screen.
- Equal-weight tile grids (news-portal energy).
- Fake or placeholder content presented as real. Empty slots show as honest dashed boxes or tasteful drawn paper.
- Anything that leans on test scores, GPA, awards or math (brand rule from the original brief).
- Lilac, wax seals and engraved illustration. That's Mitski's world.
- **The AI-site look** (checked Oct 28, 2026 against published lists of AI design tells):
  - Pill buttons, round glossy "coin" buttons with radial gradients, and glowing hover halos. Buttons and toggles here are square plates: brass outline, flat fill, lit = flat sunset, no glow, no grow-on-hover. Round is only for things that are round in real life (records, push pins, subway bullets, postmarks).
  - Frosted glass (`backdrop-filter`) on headers, bars or panels. Use a solid ink fill and a brass hairline.
  - Rounded cards in a grid. Photos are prints with a paper border and square corners.
  - Dashboard stat boxes. Numbers go on something from his world, like a receipt.
  - Purple or blue gradient placeholders. Empty slots are flat dark paper with a dashed line.
  - Tracked uppercase eyebrow labels above every heading, a script or coloured accent word inside a headline, "A · B · C" meta strings, and arrows on every link.
  - Sparkles, pulsing "live" dots, pulsing play buttons and drifting light blobs.

---

## 9. Before you ship a visual change

1. Does it pass the three questions at the top?
2. Is it checked on a 390px-wide screen, and is the Join button visible on the first screen?
3. Is it checked with `prefers-reduced-motion`, and is all the content still there?
4. Does every animation touch only transform and opacity? Do Chrome DevTools paint flashes stay quiet while scrolling?
5. Are images within budget, with width and height set, and no `loading="lazy"` inside a moving camera?
6. Is every text and background pair in the contrast table, or measured at 4.5:1 or better?
7. Are there still 3 fonts or fewer?
8. Does it work in Firefox (no scroll timelines or view transitions) without looking broken?
9. Is it verified on the live GitHub Pages site after pushing, about 40 seconds later?
