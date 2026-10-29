# Connect the Google Sheet (about 5 minutes, all in your browser)

This sets up the Google Sheet that keeps your mailing list and analytics. You only do it once.

## 1. Make the Sheet
1. Go to **sheets.new** while signed in to the Google account you want to own the data.
2. Name it **Xander Hudson Website**.

## 2. Add the backend code
1. In the Sheet's menu, open **Extensions → Apps Script**. A code editor opens in a new tab.
2. Delete everything in the editor.
3. Open **backend/Code.gs** on GitHub, click the **Copy raw file** button (two overlapping squares), and paste it into the editor.
4. Click the **Save** icon (💾).

## 3. Run setup once (this makes your admin key)
1. In the bar at the top of the editor, make sure the dropdown says **setup**, then click **Run**.
2. Google asks for permission: **Review permissions** → choose your account → **Advanced** → **Go to (project name)** → **Allow**. This lets the code write to *your* Sheet. Nothing else.
3. At the bottom, the **Execution log** shows *Your admin key: …*. **Copy that key** and keep it somewhere private. It unlocks your dashboard.

Your Sheet now has two tabs: **Subscribers** and **Events**.

## 4. Put it online
1. Top right: **Deploy → New deployment**.
2. Click the gear ⚙ next to "Select type" → **Web app**.
3. Set **Execute as: Me** and **Who has access: Anyone**. ("Anyone" lets your website send emails in. Reading the data still needs your admin key.)
4. Click **Deploy**, then copy the **Web app URL**. It ends in `/exec`.

## 5. Send that URL to Claude
Send the URL (not the admin key) and Claude will put it in `content/config.js` and publish it. Or do it yourself: on GitHub, open `content/config.js`, click the pencil, paste it between the quotes of `backend: ""`, then **Commit changes**.

## 6. Open your dashboard
Go to **https://alexanderh8809-oss.github.io/Music-Artist/admin.html** and paste your admin key. Your browser remembers it.

---

**If you change Code.gs later:**
1. Paste the new code over the old (step 2), and **Save**.
2. Run **setup** again (step 3). It adds any new columns and tabs, and keeps all your data. If Google asks for permission again, allow it. The October 29, 2026 version asks to **send email as you**, so industry messages reach your inbox.
3. Deploy → **Manage deployments** → ✏️ edit → Version: **New version** → Deploy. The URL stays the same.

**Privacy:** the site only stores what's needed: emails people type in, a name only if a Founding Fan chooses to sign the register, messages sent from the Industry page, plus anonymous visit info: a random visitor ID kept in their browser, the page, where they came from, time zone and device type. No IP addresses, no third-party trackers.
