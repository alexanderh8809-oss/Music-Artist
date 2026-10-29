# Xander Hudson — website

A fast, mobile-first artist site. Plain HTML/CSS/JS, no build step.

- **index.html**: link-in-bio home (mailing list, Spotify, TikTok), shows & merch by continent, the first postcards, the bio
- **journey.html**: life in music, stage by stage
- **merch.html**: postcards and prices
- **fans.html**: Founding Fans, the register of the first 1,000 on the mailing list
- **contact.html**: Industry, a contact form for labels, booking, management, publishing, brands and press

## Editing (no code needed)

Everything you'd change lives in the **`content/`** folder. On GitHub, open a file and click the pencil icon.

| File | What it controls |
| --- | --- |
| `content/config.js` | Music email, industry email, Spotify / TikTok / Instagram / YouTube links, the Google Sheet backend link |
| `content/tour.js` | Tour dates per continent (the stops on the X line) |
| `content/merch.js` | Postcards: price, place, date, photo, song clip, checkout link |
| `content/journey.js` | Journey stages |
| `content/fanwall.js` | The fan wall on the home page: fan photos, fan art and comments |

### Adding journey stages
1. Open **`yoursite/journey.html?edit`**.
2. The newspaper at the top is the front page: type your headline and what the journey means to you. Add your birth year under it and your age shows next to each year down the left (or type an age on a stage).
3. Type into the dashed boxes. Use **+ Add stage** for a new one. Pick **Postcard** (smaller moment) or **Video** (bigger moment).
4. For photos: upload them to `images/journey/` on GitHub (Add file → Upload files), then type the path, e.g. `images/journey/first-show.jpg`.
5. For video: paste a YouTube link, or upload an `.mp4` to `images/journey/` and type its path.
6. Press **Download journey.js**, then upload it into the `content/` folder on GitHub, replacing the old one.

## Mailing list + analytics (Google Sheet)

Every email and every visit, click and song play goes into a Google Sheet you own. Your private dashboard is **`yoursite/admin.html`**. Setup takes about 5 minutes; follow **`backend/SETUP.md`**.

**Tip:** tag each link-in-bio URL so the dashboard knows exactly where people came from:
- TikTok bio: `https://alexanderh8809-oss.github.io/Music-Artist/?utm_source=tiktok`
- Instagram bio: `https://alexanderh8809-oss.github.io/Music-Artist/?utm_source=instagram`

Until the Sheet is connected, the Join form opens an email to your music address instead.

## The fan wall

The "Made by you." section on the home page is two rows of fan photos, fan art and comments that drift slowly across the screen (they pause when you hover). To add a piece, ask the fan first, upload the picture to `images/fans/` on GitHub, then add a line to `content/fanwall.js`; the examples at the top of that file show each kind. Until there are 8 pieces, empty frames ("your selfie with Xander", "your drawing"...) fill the gaps and invite fans to send theirs. The **Send yours** link opens an email to your music address.

## Founding Fans

The first **1,000** people to join the mailing list are Founding Fans, for life. The Google Sheet gives each signup a **Fan #** in the order they joined and marks the first 1,000 **Founding: Yes**. That never changes, even if the list grows to millions.

- **To email only Founding Fans:** in the Sheet's Subscribers tab, filter the **Founding** column to *Yes* and copy the emails.
- **The register** on `fans.html` shows each number, plus a name if the fan chose to add one after joining. Emails are never shown.
- **To hide a name:** type **No** in that fan's **Show on wall** cell. It disappears from the register within two minutes.
- **What they get** is listed on the pass in `fans.html` (search for "What Founding Fans get"). Change those lines to match what you'll really do for them.

## Industry contact

Messages sent from `contact.html` are saved to the Sheet's **Inquiries** tab and emailed to the Google account that owns the Sheet, with Reply set to the sender. They also show on your dashboard. To send them to another address, add a Script Property named `NOTIFY_EMAIL` in Apps Script (⚙ Project Settings → Script Properties). The "Prefer email?" address on the page is `industryEmail` in `content/config.js` (blank uses `contactEmail`). If the Sheet can't take a message, the sender's email app opens with it already written.

## Songs on Spotify

Paste your Spotify link into `content/config.js` under `spotify` (your artist page, an album or a playlist of the songs; in Spotify: **Share → Copy link**). Spotify's player then shows on the home page next to the record, with the track list. Whatever song is playing, the record is labelled with its name. The same link fills the Spotify button on the side.

## Publishing

**GitHub Pages (simplest):** repo → Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`. The site will be at `https://alexanderh8809-oss.github.io/Music-Artist/`.

**Firebase Hosting (custom domain friendly):** with the Firebase CLI, run `firebase deploy` from this folder. `firebase.json` is already set up.
