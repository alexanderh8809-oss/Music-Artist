# Xander Hudson website: design brief

*October 28, 2026. The rules behind this brief are in `.claude/skills/xander-web-aesthetic/SKILL.md`.*

## The idea in one line

**One New York building at golden hour, and you ride the elevator through it.** Each page is a floor. Each floor is a real room full of his real objects. It's grounded and specific, a little cinematic, and never fully happy or fully sad, like the songs.

Why this concept:
- His brand says **real places by default**. The elevator is a real place, and "Elevator Girl" is one of his songs.
- No other artist we studied owns it. McCartney is collage, Laufey is a starry clock, Mitski is lilac letters, Billie is a store grid.
- It gives the site motion that *means* something. Moving between pages is the elevator moving. That makes the 3D purposeful instead of decorative.
- It stays light. Doors, floor numbers and layered skyline depth are all cheap CSS.

## Where the site is now (honest read)

- **Journey is the strongest page.** It already has a world: a corkboard, string, torn paper and photos that fade by age. Keep it and refine it.
- **Home is the weakest.** A dark screen with a centered name and buttons is the template look. It has no photo of him and no object from his world above the fold.
- **The colors are right and the contrast is good.** All main text pairs pass, and the orange button already uses dark text, which is correct.
- **There are too many fonts: 5, and the brand allows 3.** Big Shoulders and Permanent Marker should go.
- **The photos are heavy.** `MORETHANWORDS .png` is 1.9MB and `TikToks.png` is 1.3MB. Several JPGs are over 600KB. On phones, that's the main source of lag.

## The floors

### Lobby: Home (`index.html`)
- **First screen:** a real photo of him, warm and single-source lit, cropped off one edge. The heavy serif wordmark is huge and overlaps the photo edge. "Join my mailing list" stays the one orange button, with Spotify and TikTok beside it.
- **Behind the photo:** a sunset sky (a CSS gradient) and a cut-paper NYC skyline in 3 layers. On scroll, and on tilt for desktop, the layers separate slightly in depth (CSS 3D, ±6° at most).
- **The quiet double, used once on the whole site:** his reflection in a window pane on the hero, drifting a beat behind as you scroll.
- **The elevator panel:** a small brass floor indicator fixed in the corner (L · 1 · 2 · 3 · 4) that lights the current floor. It works as the menu. On phones it opens like an elevator button panel.
- **Bio:** stays right under the hero, set like a lyric sheet on bone paper with one script line.
- **Songs:** the 7 early songs as **postcards you flip in 3D.** The front is the image, the back has the place, date and a handwritten line. Tap to flip.

### Floor 1: Journey (`journey.html`)
- Keep everything that's built.
- Replace Permanent Marker with the script font, and Big Shoulders labels with Hanken Grotesk uppercase.
- **The ox appears at "to be continued…"**, holding the note. Clicking it opens the mailing list.
- Compress all journey photos to 300KB or less.

### Floor 2: Postcards and merch (`merch.html`)
- A **postcard spinner rack**, like the one by a bodega register: a CSS 3D carousel you drag or swipe to rotate. Tap a card to flip it and see the price on its back, written like a receipt.
- "The First Postcards (set of 7)" sits up front, in a paper sleeve.

### Floor 3: Shows (part of the home page today)
- Continent selection stays, restyled as a **subway map on the wall**: verdigris lines with each continent as a stop. Dates are **printed tickets**. An empty region shows a ticket stub reading "Not in Asia yet, join to hear first".

### Rooftop: Mailing list
- The sign-up confirmation is the ox tucking your note into its pocket, as a short CSS animation. It's the one playful "share it" moment, in the spirit of brat's fan tool.

### Basement: 404 page
- "Stuck between floors." Elevator doors are slightly open, with a button back to the lobby.

## Motion plan

| Moment | Technique | Cost |
|---|---|---|
| Page to page | Cross-document View Transition styled as elevator doors (Chrome and Safari; Firefox just loads normally) | Free |
| Floor indicator | CSS transition on the lit number | Free |
| Hero skyline depth | 3 layers, CSS 3D, transform only | Very low |
| Bio and section reveals | IntersectionObserver, fires once | Very low |
| Postcard flip and spinner rack | CSS 3D `rotateY` with `backface-visibility` | Low |
| Journey camera | Already built (one camera container, rAF) | Low |
| Optional: living sunset sky | One small WebGL shader, lazy-loaded, paused offscreen, with a CSS gradient fallback | Only if phones stay smooth |

Reduced motion turns all of it off, and the page still reads completely.

## Build order (each phase is publishable on its own)

1. **Clean-up (fast, no visual risk):** compress every photo, merge down to 3 fonts, fix any contrast gaps. *This removes most of the lag.*
2. **Lobby:** new hero with photo, skyline and reflection, plus the postcard flip songs.
3. **Elevator:** floor indicator nav, door page transitions and the 404 page.
4. **Floor 2:** postcard spinner rack merch.
5. **Floor 3:** subway-map shows and ticket dates.
6. **Ox moments:** the Journey ending and sign-up confirmation, once his ox artwork is ready.
7. **Optional:** WebGL sunset sky, only if phase 2 feels like it needs more life.

## What's needed from Xander

- **A hero photo:** him in a real place, warm light, not overproduced. Vertical works best for phones.
- **Ox artwork:** a PNG with a transparent background, if it exists yet. If not, the ox moments wait.
- **A yes or no on the elevator concept** before phase 3. Phases 1–2 stand on their own either way.
- **A yes on dropping the two extra fonts** (this changes the Journey year and note style a little).

## Research sources

- Visited directly: paulmccartney.com, billieeilish.com (redirects to its store), laufeymusic.com, mitski.com, clairo.com, danielcaesar.com
- [Chrome: View Transition API](https://developer.chrome.com/docs/web-platform/view-transitions) · [Chrome: scroll-triggered animations](https://developer.chrome.com/blog/scroll-triggered-animations) · [ICS: scroll-driven animations](https://ics.media/en/entry/230718/)
- [web.dev: Merry Pixmas CSS 3D case study](https://web.dev/case-studies/merry-pixmas) · [CSS 3D DOOM write-up (camera container technique)](https://www.kunalganglani.com/blog/css-3d-transforms-doom-browser.md)
- [Core Web Vitals thresholds](https://corewebvitals.io/core-web-vitals) · [Vision Australia: 60-30-10 and accessible palettes](https://visionaustralia.org/business-consulting/digital-access/Creating-accessible-digital-colour-palettes-60-30-10-design-rule)
- [SVG noise vs image grain (120KB saved)](https://www.jeantinland.com/blog/120kb-less/) · [Charli XCX brat rollout (Billboard)](https://ca.billboard.com/music/pop/charli-xcx-brat-album-rollout-remix-strategy-1235854293) · [Awwwards: brat microsite](https://www.awwwards.com/sites/charli-xcx)
- Contrast ratios were calculated from the site's actual color values with the WCAG 2.x formula.
