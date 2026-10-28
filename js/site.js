/* Shared behavior: mailing list, footer, analytics. No settings in here —
   everything you'd change lives in content/config.js. */
(function () {
  const S = window.SITE || {};
  const fb = S.firebase || {};
  const firebaseOn = !!(fb.apiKey && fb.projectId);

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

  /* ---------- Where did this visitor come from? ---------- */
  function visitSource() {
    const p = new URLSearchParams(location.search);
    if (p.get("utm_source")) return p.get("utm_source").toLowerCase();
    const ref = document.referrer;
    if (!ref) return "direct";
    try {
      const host = new URL(ref).hostname.replace(/^www\./, "");
      if (host === location.hostname) return "internal";
      if (/tiktok/.test(host)) return "tiktok";
      if (/instagram|l\.instagram/.test(host)) return "instagram";
      if (/spotify/.test(host)) return "spotify";
      if (/youtube|youtu\.be/.test(host)) return "youtube";
      if (/(^|\.)t\.co$|twitter|x\.com/.test(host)) return "x";
      if (/facebook|fb\.com/.test(host)) return "facebook";
      return host;
    } catch { return "unknown"; }
  }
  // Remember the first source for the whole visit, so signups get credited correctly
  let source = "direct";
  try {
    source = sessionStorage.getItem("xh_src") || visitSource();
    if (source !== "internal") sessionStorage.setItem("xh_src", source);
  } catch { source = visitSource(); }

  /* ---------- Analytics (Firebase / Google Analytics 4) ---------- */
  let analytics = null, logEvent = null;
  const queue = [];
  window.XH.track = function (name, params = {}) {
    params = { source, ...params };
    if (analytics) logEvent(analytics, name, params); else queue.push([name, params]);
  };
  function loadAnalytics() {
    if (!firebaseOn || !fb.measurementId) return;
    const v = "10.12.2";
    Promise.all([
      import(`https://www.gstatic.com/firebasejs/${v}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${v}/firebase-analytics.js`)
    ]).then(([app, an]) => {
      analytics = an.getAnalytics(app.initializeApp(fb));
      logEvent = an.logEvent;
      queue.splice(0).forEach(([n, p]) => logEvent(analytics, n, p));
    }).catch(() => {});
  }
  // Load after the page is interactive so it never slows the first paint
  addEventListener("load", () => (window.requestIdleCallback ? requestIdleCallback(loadAnalytics) : setTimeout(loadAnalytics, 1)));
  window.XH.track("visit", { page: location.pathname });

  // Outbound link clicks (Spotify, TikTok, tickets, checkout)
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-track]");
    if (a) window.XH.track("outbound_click", { link: a.dataset.track });
  });

  /* ---------- Mailing list ---------- */
  function saveSubscriber(email) {
    // Writes to Firestore collection "subscribers" via REST (no heavy SDK)
    const url = `https://firestore.googleapis.com/v1/projects/${fb.projectId}/databases/(default)/documents/subscribers?key=${fb.apiKey}`;
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          email: { stringValue: email },
          source: { stringValue: source },
          page: { stringValue: location.pathname },
          createdAt: { timestampValue: new Date().toISOString() }
        }
      })
    }).then((r) => { if (!r.ok) throw new Error(r.status); });
  }

  function buildDialog() {
    const d = document.createElement("dialog");
    d.className = "dialog";
    d.id = "join-dialog";
    d.setAttribute("aria-labelledby", "join-title");
    d.innerHTML = `
      <div class="dialog__card paper" style="${paper(77, "tb", 1.8)}">
        <span class="label">Mailing list · Admit one</span>
        <button class="dialog__close" type="button" aria-label="Close">&times;</button>
        <h2 id="join-title">Get the next postcard first.</h2>
        <p>New songs, poster drops and shows near you. No spam, unsubscribe any time.</p>
        <form class="field" novalidate>
          <label class="visually-hidden" for="join-email">Email address</label>
          <input id="join-email" type="email" name="email" autocomplete="email" inputmode="email" placeholder="you@email.com" required>
          <button class="btn btn--hit" type="submit">Join the list</button>
        </form>
        <div class="form-msg" role="status" aria-live="polite"></div>
      </div>`;
    document.body.appendChild(d);
    const form = $("form", d), msg = $(".form-msg", d), input = $("input", d), btn = $("button[type=submit]", d);
    $(".dialog__close", d).addEventListener("click", () => d.close());
    d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = input.value.trim();
      msg.className = "form-msg";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = "That email doesn't look right."; msg.classList.add("err"); return; }
      if (!firebaseOn) {
        // Fallback until Firebase is connected
        location.href = `mailto:${S.contactEmail}?subject=${encodeURIComponent("Add me to the mailing list")}&body=${encodeURIComponent(email)}`;
        return;
      }
      btn.disabled = true; msg.textContent = "Adding you…";
      saveSubscriber(email).then(() => {
        window.XH.track("join_list");
        form.hidden = true;
        msg.innerHTML = `You're on the list. <span class="scrap">see you soon</span>`;
      }).catch(() => {
        msg.textContent = "Something went wrong. Try again in a moment."; msg.classList.add("err");
      }).finally(() => { btn.disabled = false; });
    });
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

  /* ---------- Footer ---------- */
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

  /* ---------- Postcards flip over when tapped ---------- */
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".pcard__flip");
    if (!b) return;
    const card = b.closest(".pcard");
    const on = card.classList.toggle("is-flipped");
    b.setAttribute("aria-pressed", on);
    if (on) window.XH.track("postcard_flip", { card: card.dataset.id || "" });
  });

  /* ---------- Fill link-in-bio buttons from config ---------- */
  document.querySelectorAll("[data-link]").forEach((a) => {
    const url = (S.links || {})[a.dataset.link];
    if (url) a.href = url; else a.remove();
  });
})();
