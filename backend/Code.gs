/* ============================================================
   XANDER HUDSON — website backend (Google Apps Script)

   Lives inside a Google Sheet. It does three jobs:
   1. Saves every mailing-list email to the "Subscribers" tab.
   2. Saves every visit and click to the "Events" tab.
   3. Sends the private dashboard (admin.html) its numbers,
      but only when the request carries your admin key.

   Setup steps are in backend/SETUP.md.
   ============================================================ */

const TZ = "America/New_York";
const SUBS = "Subscribers", EVENTS = "Events";
const SUB_HEAD = ["Time", "Email", "Source", "Page", "Visitor", "How"];
const EV_HEAD = ["Time", "Visitor", "Session", "Event", "Page", "Source", "Referrer", "Detail", "Device", "Timezone", "Language", "Screen"];

/* Run this once from the editor (Run ▸ setup). It makes the tabs and your admin key. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  [[SUBS, SUB_HEAD], [EVENTS, EV_HEAD]].forEach(([name, head]) => {
    const sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) { sh.appendRow(head); sh.setFrozenRows(1); sh.getRange(1, 1, 1, head.length).setFontWeight("bold"); }
  });
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty("ADMIN_KEY")) props.setProperty("ADMIN_KEY", Utilities.getUuid().replace(/-/g, "").slice(0, 20));
  Logger.log("Your admin key (paste it into the dashboard): " + props.getProperty("ADMIN_KEY"));
}

/* ---------- Writes from the website ---------- */
function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false }); }
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (body.type === "signup") return json(addSubscriber(ss, body));
    if (body.type === "events" && Array.isArray(body.events)) {
      const rows = body.events.slice(0, 50).map(eventRow);
      if (rows.length) {
        const sh = ss.getSheetByName(EVENTS);
        sh.getRange(sh.getLastRow() + 1, 1, rows.length, EV_HEAD.length).setValues(rows);
      }
      return json({ ok: true, saved: rows.length });
    }
    return json({ ok: false });
  } finally { lock.releaseLock(); }
}

const clip = (v, n) => String(v == null ? "" : v).slice(0, n);

function addSubscriber(ss, b) {
  const email = clip(b.email, 120).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "email" };
  const sh = ss.getSheetByName(SUBS);
  const dupe = sh.getRange("B:B").createTextFinder(email).matchEntireCell(true).findNext();
  if (dupe) return { ok: true, already: true };
  sh.appendRow([new Date(), email, clip(b.source, 40), clip(b.page, 80), clip(b.visitor, 40), clip(b.how, 20)]);
  // the signup also counts as an event, so the dashboard can see where it happened
  const ev = ss.getSheetByName(EVENTS);
  ev.appendRow(eventRow({ event: "join_list", visitor: b.visitor, session: b.session, page: b.page, source: b.source, detail: b.how }));
  return { ok: true };
}

function eventRow(x) {
  return [new Date(), clip(x.visitor, 40), clip(x.session, 40), clip(x.event, 40), clip(x.page, 80), clip(x.source, 40),
    clip(x.referrer, 80), clip(x.detail, 120), clip(x.device, 12), clip(x.tz, 40), clip(x.lang, 12), clip(x.screen, 12)];
}

/* ---------- Reads for the private dashboard ---------- */
function doGet(e) {
  const p = e.parameter || {};
  const key = PropertiesService.getScriptProperties().getProperty("ADMIN_KEY");
  if (!key || p.key !== key) return json({ ok: false, error: "key" });
  const days = Math.min(365, Math.max(1, Number(p.days) || 30));
  return json(stats(days));
}

function stats(days) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const since = new Date(Date.now() - days * 864e5);
  const day = (d) => Utilities.formatDate(d, TZ, "yyyy-MM-dd");

  const ev = ss.getSheetByName(EVENTS).getDataRange().getValues().slice(1).filter((r) => r[0] instanceof Date && r[0] >= since);
  const subs = ss.getSheetByName(SUBS).getDataRange().getValues().slice(1).filter((r) => r[0] instanceof Date);
  const subsIn = subs.filter((r) => r[0] >= since);

  const count = (rows, fn) => {
    const m = {};
    rows.forEach((r) => { const k = fn(r); if (k) m[k] = (m[k] || 0) + 1; });
    return Object.keys(m).map((k) => ({ name: k, value: m[k] })).sort((a, b) => b.value - a.value);
  };
  const of = (name) => ev.filter((r) => r[3] === name);
  const visits = of("visit");
  const visitors = new Set(visits.map((r) => r[1]).filter(String));

  // one row per day in the range, oldest first
  const daily = [];
  for (let i = days - 1; i >= 0; i--) daily.push({ date: day(new Date(Date.now() - i * 864e5)), visits: 0, visitors: 0, signups: 0 });
  const byDay = {}; daily.forEach((d) => (byDay[d.date] = d));
  const seen = {};
  visits.forEach((r) => {
    const d = byDay[day(r[0])]; if (!d) return;
    d.visits++;
    const k = d.date + r[1]; if (!seen[k]) { seen[k] = 1; d.visitors++; }
  });
  subsIn.forEach((r) => { const d = byDay[day(r[0])]; if (d) d.signups++; });

  // deepest journey stage each visit reached
  const depth = {};
  of("journey_stage").forEach((r) => {
    const s = Number(String(r[7]).replace(/\D/g, "")) || 0;
    depth[r[2]] = Math.max(depth[r[2]] || 0, s);
  });
  const journey = count(Object.keys(depth).map((k) => [depth[k]]), (r) => (r[0] === 0 ? "Start only" : "Reached stage " + r[0]));

  const place = (tz) => (tz ? String(tz).split("/").pop().replace(/_/g, " ") : "");
  const leaves = of("leave").map((r) => Number(r[7]) || 0).filter((s) => s > 0 && s < 3600).sort((a, b) => a - b);

  return {
    ok: true, days, sheetUrl: ss.getUrl(), generated: new Date().toISOString(),
    totals: {
      visits: visits.length,
      visitors: visitors.size,
      signups: subsIn.length,
      subscribersAllTime: subs.length,
      spotify: of("outbound_click").filter((r) => r[7] === "spotify").length,
      tiktok: of("outbound_click").filter((r) => r[7] === "tiktok").length,
      medianSeconds: leaves.length ? leaves[Math.floor(leaves.length / 2)] : 0
    },
    daily,
    sources: count(visits, (r) => r[5] || "direct"),
    referrers: count(visits, (r) => r[6]),
    pages: count(visits, (r) => r[4]),
    places: count(visits, (r) => place(r[9])),
    devices: count(visits, (r) => r[8]),
    clicks: count(of("outbound_click"), (r) => r[7]),
    postcards: count(ev.filter((r) => r[3] === "song_play" || r[3] === "postcard_flip"), (r) => (r[3] === "song_play" ? "Played: " : "Flipped: ") + r[7]),
    journey,
    popup: { shown: of("popup_shown").length, joined: subsIn.filter((r) => r[5] === "popup").length, dismissed: of("popup_dismiss").length },
    scroll: count(of("scroll_depth"), (r) => r[4] + " · " + r[7] + "%"),
    subscribers: subs.slice(-100).reverse().map((r) => ({ time: r[0].toISOString(), email: r[1], source: r[2], page: r[3], how: r[5] })),
    recent: ev.slice(-40).reverse().map((r) => ({ time: r[0].toISOString(), event: r[3], page: r[4], source: r[5], detail: r[7], place: place(r[9]) }))
  };
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
