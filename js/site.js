/* Shared behavior: analytics, the mailing list (dialog + pop-up), footer,
   postcard flips. No settings in here — they live in content/config.js.
   Data goes to the Google Sheet backend (backend/Code.gs). */
(function () {
  const S = window.SITE || {};
  const API = (S.backend || "").trim();

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Torn paper edges: a ragged clip-path, the same every visit for the same piece
  function rng(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function tear(seed, edges, amp = 1.6) {
    const r = rng(seed * 7919 + 17), pts = [];
    const side = (e, n, at) => {
      let d = amp / 2;
      for (let k = 0; k < n; k++) {
        if (!edges.includes(e)) { pts.push(at(k / n, -6)); continue; }
        d = Math.max(0, Math.min(amp * 1.6, d * 0.45 + r() * amp * (r() < 0.12 ? 2.4 : 1)));
        pts.push(at(k / n, d));
      }
    };
    side("t", 26, (s, d) => [s * 100, d]);
    side("r", 34, (s, d) => [100 - d, s * 100]);
    side("b", 26, (s, d) => [100 - s * 100, 100 - d]);
    side("l", 34, (s, d) => [d, 100 - s * 100]);
    return `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}% ${y.toFixed(1)}%`).join(",")})`;
  }
  // the outline plus a coffee ring in a different spot on some pieces
  const paper = (seed, edges, amp) => {
    const r = rng(seed * 31 + 5);
    const ring = r() < 0.45 ? `--stain-at:${Math.round(r() * 100)}% ${Math.round(r() * 100)}%;` : "--stain-size:0 0;";
    return `--tear:${tear(seed, edges, amp)};${ring}`;
  };
  window.XH = { $, esc, rng, tear, paper };

  const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { return null; } };
  const page = location.pathname.replace(/^.*\//, "") || "index.html";
  const editing = new URLSearchParams(location.search).has("edit");

  /* ---------- Who is this, and where did they come from? ---------- */
  function visitSource() {
    const p = new URLSearchParams(location.search);
    if (p.get("utm_source")) return p.get("utm_source").toLowerCase();
    const ref = document.referrer;
    if (!ref) return "direct";
    try {
      const host = new URL(ref).hostname.replace(/^www\./, "");
      if (host === location.hostname) return "internal";
      if (/tiktok/.test(host)) return "tiktok";
      if (/instagram/.test(host)) return "instagram";
      if (/spotify/.test(host)) return "spotify";
      if (/youtube|youtu\.be/.test(host)) return "youtube";
      if (/(^|\.)t\.co$|twitter|x\.com/.test(host)) return "x";
      if (/facebook|fb\.com/.test(host)) return "facebook";
      if (/google\./.test(host)) return "google";
      return host;
    } catch { return "unknown"; }
  }
  // the first source of the visit sticks, so a signup three pages later still credits TikTok
  let source = "direct";
  try {
    const tagged = new URLSearchParams(location.search).has("utm_source");
    source = (!tagged && sessionStorage.getItem("xh_src")) || visitSource();
    if (source !== "internal") sessionStorage.setItem("xh_src", source);
  } catch { source = visitSource(); }
  const rid = () => Math.random().toString(36).slice(2, 12);
  const visitor = store("xh_vid") || (store("xh_vid", rid()), store("xh_vid") || rid());
  let session;
  try { session = sessionStorage.getItem("xh_sid") || (sessionStorage.setItem("xh_sid", rid()), sessionStorage.getItem("xh_sid")); } catch { session = rid(); }
  const refHost = (() => { try { const h = new URL(document.referrer).hostname.replace(/^www\./, ""); return h === location.hostname ? "" : h; } catch { return ""; } })();
  const device = matchMedia("(pointer: coarse)").matches ? (Math.min(screen.width, screen.height) >= 700 ? "tablet" : "phone") : "computer";
  const base = { visitor, session, page, source, referrer: refHost, device, tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "", lang: navigator.language || "", screen: `${screen.width}x${screen.height}` };

  /* ---------- Analytics: batched, sent with sendBeacon so it never slows the page ---------- */
  const queue = [];
  let timer = 0;
  function flush() {
    clearTimeout(timer); timer = 0;
    if (!API || !queue.length) return;
    const body = JSON.stringify({ type: "events", events: queue.splice(0, 50) });
    if (!(navigator.sendBeacon && navigator.sendBeacon(API, new Blob([body], { type: "text/plain" })))) {
      fetch(API, { method: "POST", mode: "no-cors", keepalive: true, headers: { "Content-Type": "text/plain" }, body }).catch(() => {});
    }
  }
  window.XH.track = function (event, detail = "") {
    if (editing) return;
    queue.push({ ...base, event, detail: typeof detail === "object" ? Object.values(detail).join(" ") : String(detail) });
    if (!timer) timer = setTimeout(flush, 2000);
  };
  window.XH.track("visit");

  // outbound links: Spotify, TikTok, tickets, buy buttons
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-track]");
    if (a) window.XH.track("outbound_click", a.dataset.track);
  });
  // how far down each page people get, and how long they stay
  const marks = [25, 50, 75, 100], hit = new Set();
  addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (max <= 0) return;
    const pct = (scrollY / max) * 100;
    marks.forEach((m) => { if (pct >= m - 2 && !hit.has(m)) { hit.add(m); window.XH.track("scroll_depth", m); } });
  }, { passive: true });
  const started = Date.now();
  let left = false;
  const leave = () => { if (left) return; left = true; window.XH.track("leave", Math.round((Date.now() - started) / 1000)); flush(); };
  addEventListener("pagehide", leave);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });

  /* ---------- Mailing list ---------- */
  const joined = () => store("xh_joined") === "1";
  function saveSubscriber(email, how) {
    // no-cors: the sheet saves it, the browser just can't read the reply
    return fetch(API, {
      method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ type: "signup", email, how, ...base })
    });
  }
  // one form, used by both the dialog and the pop-up
  function wireForm(root, how, onDone) {
    const form = $("form", root), msg = $(".form-msg", root), input = $("input", root), btn = $("button[type=submit]", root);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = input.value.trim();
      msg.className = "form-msg";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = "That email doesn't look right."; msg.classList.add("err"); return; }
      if (!API) { // until the Google Sheet is connected
        location.href = `mailto:${S.contactEmail}?subject=${encodeURIComponent("Add me to the mailing list")}&body=${encodeURIComponent(email)}`;
        return;
      }
      btn.disabled = true; msg.textContent = "Adding you…";
      saveSubscriber(email, how).then(() => {
        store("xh_joined", "1");
        form.hidden = true;
        msg.innerHTML = `You're on the list. <span class="scrap">see you soon</span>`;
        onDone && onDone();
      }).catch(() => {
        msg.textContent = "Something went wrong. Try again in a moment."; msg.classList.add("err");
      }).finally(() => { btn.disabled = false; });
    });
  }
  const formHTML = (id) => `
    <form class="field" novalidate>
      <label class="visually-hidden" for="${id}">Email address</label>
      <input id="${id}" type="email" name="email" autocomplete="email" inputmode="email" placeholder="you@email.com" required>
      <button class="btn btn--hit" type="submit">Join the list</button>
    </form>
    <div class="form-msg" role="status" aria-live="polite"></div>`;

  function buildDialog() {
    const d = document.createElement("dialog");
    d.className = "dialog";
    d.setAttribute("aria-labelledby", "join-title");
    d.innerHTML = `
      <div class="dialog__card paper" style="${paper(77, "tb", 1.8)}">
        <span class="label">Admit one</span>
        <button class="dialog__close" type="button" aria-label="Close">&times;</button>
        <h2 id="join-title">Get the next postcard first.</h2>
        <p>New songs, postcard drops and shows near you.</p>
        ${formHTML("join-email")}
      </div>`;
    document.body.appendChild(d);
    $(".dialog__close", d).addEventListener("click", () => d.close());
    d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
    wireForm(d, "button", () => hidePop());
    return d;
  }
  let dialog;
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-join]")) return;
    e.preventDefault();
    dialog = dialog || buildDialog();
    dialog.showModal();
    window.XH.track("open_join");
  });

  /* ---------- The pop-up: a ticket that slides up on its own, once ----------
     Shows 8 seconds in. Never blocks the page,
     never comes back for 7 days after it's closed, never after joining. */
  let pop = null;
  function hidePop() { if (pop) pop.classList.remove("is-in"); }
  function showPop() {
    if (pop || joined() || editing || page === "admin.html" || page === "404.html") return;
    const until = Number(store("xh_pop_until") || 0);
    if (Date.now() < until) return;
    pop = document.createElement("aside");
    pop.className = "pop paper";
    pop.setAttribute("aria-label", "Join the mailing list");
    pop.setAttribute("style", paper(81, "lr", 1.4));
    pop.innerHTML = `
      <button class="pop__close" type="button" aria-label="Close">&times;</button>
      <span class="label">Admit one</span>
      <h2>Get the next postcard first.</h2>
      ${formHTML("pop-email")}`;
    document.body.appendChild(pop);
    wireForm(pop, "popup", () => setTimeout(hidePop, 2600));
    $(".pop__close", pop).addEventListener("click", () => {
      hidePop();
      store("xh_pop_until", String(Date.now() + 7 * 864e5));
      window.XH.track("popup_dismiss");
    });
    void pop.offsetWidth; // lay it out off-screen first so it slides in
    pop.classList.add("is-in");
    window.XH.track("popup_shown");
  }
  if (!joined() && !editing) {
    setTimeout(showPop, 8000); // 8 seconds in
  }

  /* ---------- Footer: the building directory ---------- */
  const footer = $(".site-footer");
  if (footer) {
    const L = S.links || {};
    const socials = [["Spotify", L.spotify], ["TikTok", L.tiktok], ["Instagram", L.instagram], ["YouTube", L.youtube]]
      .filter(([, u]) => u)
      .map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener" data-track="${n.toLowerCase()}">${n}</a>`).join("");
    footer.innerHTML = `
      <div>
        <h2>Xander Hudson</h2>
        <p class="scrap" style="margin:6px 0 0">written in New York</p>
      </div>
      <div>
        <span class="label">Directory</span>
        <ul class="directory">
          <li><a href="./"><b>L</b>Lobby</a></li>
          <li><a href="journey.html"><b>1</b>The Journey</a></li>
          <li><a href="merch.html"><b>2</b>Postcards</a></li>
          <li><a href="./#shows"><b>3</b>Shows</a></li>
        </ul>
      </div>
      <div>
        <span class="label">Music inquiries</span>
        <a href="mailto:${esc(S.contactEmail)}">${esc(S.contactEmail)}</a>
        <div class="socials">${socials}</div>
      </div>
      <small>&copy; ${new Date().getFullYear()} Xander Hudson · New York, NY</small>`;
  }

  /* ---------- Side dock: Spotify, TikTok, Instagram, one tap away on every page ---------- */
  const icons = {
    spotify: '<path d="M12 1.5a10.5 10.5 0 1 0 0 21 10.5 10.5 0 0 0 0-21Zm4.8 15.1a.65.65 0 0 1-.9.22c-2.46-1.5-5.56-1.84-9.2-1.01a.65.65 0 1 1-.3-1.27c3.99-.91 7.4-.52 10.17 1.17.31.19.4.59.23.89Zm1.28-2.85a.82.82 0 0 1-1.12.27c-2.82-1.73-7.12-2.23-10.45-1.22a.82.82 0 1 1-.47-1.57c3.8-1.15 8.54-.6 11.77 1.39.38.23.5.74.27 1.13Zm.11-2.97C14.8 8.77 9.2 8.58 5.96 9.56a.98.98 0 1 1-.57-1.88c3.72-1.13 9.9-.91 13.81 1.41a.98.98 0 0 1-1 1.69Z"/>',
    tiktok: '<path d="M16.6 2h-3.3v13.3a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9.1a6.3 6.3 0 1 0 5.3 6.2V8.6a7.7 7.7 0 0 0 4.4 1.4V6.7a4.4 4.4 0 0 1-4.4-4.4Z"/>',
    instagram: '<path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.3-3.3a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z"/>',
    youtube: '<path d="M22.5 7.2a2.8 2.8 0 0 0-2-2C18.8 4.8 12 4.8 12 4.8s-6.8 0-8.5.4a2.8 2.8 0 0 0-2 2C1 8.9 1 12 1 12s0 3.1.5 4.8a2.8 2.8 0 0 0 2 2c1.7.4 8.5.4 8.5.4s6.8 0 8.5-.4a2.8 2.8 0 0 0 2-2c.5-1.7.5-4.8.5-4.8s0-3.1-.5-4.8ZM9.8 15.1V8.9l5.7 3.1-5.7 3.1Z"/>'
  };
  const L = S.links || {};
  const dockLinks = [["spotify", "Spotify"], ["tiktok", "TikTok"], ["instagram", "Instagram"], ["youtube", "YouTube"]].filter(([k]) => L[k]);
  if (dockLinks.length && !editing && page !== "admin.html" && page !== "404.html") {
    const dock = document.createElement("nav");
    dock.className = "dock";
    dock.setAttribute("aria-label", "Listen and follow");
    dock.innerHTML = dockLinks.map(([k, n]) =>
      `<a class="dock__btn" href="${esc(L[k])}" target="_blank" rel="noopener" data-track="${k}" aria-label="${n}">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${icons[k]}</svg><span>${n}</span></a>`).join("");
    document.body.appendChild(dock);
  }

  /* ---------- Postcards flip over when tapped ---------- */
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".pcard__flip");
    if (!b) return;
    const card = b.closest(".pcard");
    const on = card.classList.toggle("is-flipped");
    b.setAttribute("aria-pressed", on);
    if (on) window.XH.track("postcard_flip", card.dataset.id || "");
  });

  /* ---------- Fill link-in-bio buttons from config ---------- */
  document.querySelectorAll("[data-link]").forEach((a) => {
    const url = (S.links || {})[a.dataset.link];
    if (url) a.href = url; else a.remove();
  });
})();
