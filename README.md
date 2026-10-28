# Xander Hudson — website

A fast, mobile-first artist site. Plain HTML/CSS/JS, no build step.

- **index.html**: link-in-bio home (mailing list, Spotify, TikTok), shows & merch by continent, the first postcards, the bio
- **journey.html**: life in music, stage by stage
- **merch.html**: postcards and prices

## Editing (no code needed)

Everything you'd change lives in the **`content/`** folder. On GitHub, open a file and click the pencil icon.

| File | What it controls |
| --- | --- |
| `content/config.js` | Music email, Spotify / TikTok / Instagram / YouTube links, Firebase keys |
| `content/tour.js` | Tour dates per continent, and an optional photo for each sliver |
| `content/merch.js` | Postcards: price, place, date, photo, checkout link |
| `content/journey.js` | Journey stages |

### Adding journey stages
1. Open **`yoursite/journey.html?edit`**.
2. Type into the dashed boxes. Use **+ Add stage** for a new one. Pick **Postcard** (smaller moment) or **Video** (bigger moment).
3. For photos: upload them to `images/journey/` on GitHub (Add file → Upload files), then type the path, e.g. `images/journey/first-show.jpg`.
4. For video: paste a YouTube link, or upload an `.mp4` to `images/journey/` and type its path.
5. Press **Download journey.js**, then upload it into the `content/` folder on GitHub, replacing the old one.

## Mailing list + analytics (Firebase)

1. In the [Firebase console](https://console.firebase.google.com), open your project → **Project settings → Your apps → Add app → Web**. Turn on Google Analytics when asked.
2. Copy the `firebaseConfig` values into `content/config.js`.
3. **Build → Firestore Database → Create database** (production mode). Then in the **Rules** tab, paste the contents of `firestore.rules` and publish.
4. Signups appear in Firestore under **subscribers**, each with the email and where the person came from (tiktok, instagram, …).
5. Visitors, where they came from and how long they stayed: **Analytics → Dashboard** (or Google Analytics → Reports → Acquisition / Engagement).

**Tip:** for exact tracking, add a tag to each link-in-bio URL:
- TikTok bio: `https://yoursite/?utm_source=tiktok`
- Instagram bio: `https://yoursite/?utm_source=instagram`

Until Firebase is set up, the mailing list button opens an email to your music address instead.

## Publishing

**GitHub Pages (simplest):** repo → Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`. The site will be at `https://alexanderh8809-oss.github.io/Music-Artist/`.

**Firebase Hosting (custom domain friendly):** with the Firebase CLI, run `firebase deploy` from this folder. `firebase.json` is already set up.
