# Xander Hudson — website

A fast, mobile-first artist site. Plain HTML/CSS/JS, no build step.

- **index.html**: link-in-bio home (mailing list, Spotify, TikTok), shows & merch by continent, the first postcards, the bio
- **journey.html**: life in music, stage by stage
- **merch.html**: postcards and prices

## Editing (no code needed)

Everything you'd change lives in the **`content/`** folder. On GitHub, open a file and click the pencil icon.

| File | What it controls |
| --- | --- |
| `content/config.js` | Music email, Spotify / TikTok / Instagram / YouTube links, the Google Sheet backend link |
| `content/tour.js` | Tour dates per continent (the stops on the X line) |
| `content/merch.js` | Postcards: price, place, date, photo, song clip, checkout link |
| `content/journey.js` | Journey stages |

### Adding journey stages
1. Open **`yoursite/journey.html?edit`**.
2. Type into the dashed boxes. Use **+ Add stage** for a new one. Pick **Postcard** (smaller moment) or **Video** (bigger moment).
3. For photos: upload them to `images/journey/` on GitHub (Add file → Upload files), then type the path, e.g. `images/journey/first-show.jpg`.
4. For video: paste a YouTube link, or upload an `.mp4` to `images/journey/` and type its path.
5. Press **Download journey.js**, then upload it into the `content/` folder on GitHub, replacing the old one.

## Mailing list + analytics (Google Sheet)

Every email and every visit, click and song play goes into a Google Sheet you own. Your private dashboard is **`yoursite/admin.html`**. Setup takes about 5 minutes; follow **`backend/SETUP.md`**.

**Tip:** tag each link-in-bio URL so the dashboard knows exactly where people came from:
- TikTok bio: `https://alexanderh8809-oss.github.io/Music-Artist/?utm_source=tiktok`
- Instagram bio: `https://alexanderh8809-oss.github.io/Music-Artist/?utm_source=instagram`

Until the Sheet is connected, the Join form opens an email to your music address instead.

## Song clips

Put short MP3s in `music/` and add each path to its postcard in `content/merch.js` (`audio: "music/elevator-girl.mp3"`). Visitors press **Play the songs** once, then each postcard plays as it comes to the front.

## Publishing

**GitHub Pages (simplest):** repo → Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`. The site will be at `https://alexanderh8809-oss.github.io/Music-Artist/`.

**Firebase Hosting (custom domain friendly):** with the Firebase CLI, run `firebase deploy` from this folder. `firebase.json` is already set up.
