/* Lobby: the opening (intro, the scroll toward the door), the bio reveal,
   song postcards and the subway line of shows. */
(function () {
  const { $, esc, paper } = window.XH;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Intro: once per visit ---------- */
  const intro = $(".intro");
  let seen = false;
  try { seen = sessionStorage.getItem("xh_intro") === "1"; sessionStorage.setItem("xh_intro", "1"); } catch {}
  if (seen || reduced) { intro.classList.add("is-skipped"); document.body.classList.add("no-intro"); }

  /* ---------- Scrolling pulls you toward the door ---------- */
  const stage = $(".stage"), header = $(".site-header");
  let raf = 0;
  function paint() {
    raf = 0;
    const span = stage.offsetHeight - innerHeight;
    const p = span > 0 ? Math.min(1, Math.max(0, scrollY / span)) : 0;
    stage.style.setProperty("--p", p.toFixed(3));
    header.classList.toggle("is-solid", scrollY > stage.offsetHeight - innerHeight * 0.6);
  }
  if (!reduced) addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
  paint();

  /* ---------- Most played: the TikTok, loaded only when tapped ---------- */
  const F = (window.SITE || {}).featured || {};
  const vid = (String(F.video || "").match(/video\/(\d+)/) || [])[1];
  const played = $(".played");
  if (!vid) { played.hidden = true; $(".stage__proof").hidden = true; $(".mini").hidden = true; }
  else {
    document.querySelectorAll("[data-stat]").forEach((el) => { el.textContent = F[el.dataset.stat] || "–"; });
    $(".played__stats").style.cssText += paper(33, "tb", 1.4); // torn top and bottom, like a till roll
    $(".played__title").textContent = F.title || "";
    $(".played__caption").textContent = F.caption || "";
    $(".played__watch").href = F.video;
    const poster = $(".phone__poster");
    if (F.poster) poster.src = F.poster; else poster.remove();
    // It's opened by a tap, so it plays with the sound on: once TikTok's player says
    // it's ready, tell it to unmute and play (TikTok's embed postMessage API).
    const player = () => {
      const f = document.createElement("iframe");
      f.src = `https://www.tiktok.com/player/v1/${vid}?autoplay=1&rel=0&description=0&music_info=0`;
      f.allow = "autoplay; fullscreen; encrypted-media; picture-in-picture";
      f.title = F.title ? `${F.title} on TikTok` : "TikTok video";
      return f;
    };
    const tell = (f, type) => f.contentWindow && f.contentWindow.postMessage({ type, value: null, "x-tiktok-player": true }, "*");
    addEventListener("message", (e) => {
      const d = e.data;
      if (!d || !d["x-tiktok-player"] || !/tiktok\.com$/.test(new URL(e.origin).hostname)) return;
      const f = [...document.querySelectorAll("iframe")].find((x) => x.contentWindow === e.source);
      if (!f) return;
      if (d.type === "onPlayerReady") { tell(f, "unMute"); tell(f, "play"); }
      if (d.type === "onMute" && d.value === true && !f.dataset.unmuted) { f.dataset.unmuted = "1"; tell(f, "unMute"); }
    });
    $(".phone__play").addEventListener("click", (e) => {
      e.currentTarget.replaceWith(player());
      window.XH.track("tiktok_play", vid);
    });

    // the small card on the side of the opening plays it big, in a pop-up phone
    const mini = $(".mini");
    if (F.poster) $(".mini__poster").src = F.poster; else $(".mini__poster").remove();
    let sheet = null;
    mini.addEventListener("click", () => {
      if (!sheet) {
        sheet = document.createElement("dialog");
        sheet.className = "watch";
        sheet.setAttribute("aria-label", F.title ? `${F.title} on TikTok` : "TikTok video");
        sheet.innerHTML = `<button class="watch__close" type="button" aria-label="Close">&times;</button>
          <div class="phone watch__phone"></div>
          <a class="arrow-link watch__link" href="${esc(F.video)}" target="_blank" rel="noopener" data-track="tiktok_video">Open in TikTok</a>`;
        document.body.appendChild(sheet);
        const close = () => sheet.close();
        $(".watch__close", sheet).addEventListener("click", close);
        sheet.addEventListener("click", (e) => { if (e.target === sheet) close(); });
        sheet.addEventListener("close", () => { $(".watch__phone", sheet).innerHTML = ""; }); // stops the sound
      }
      $(".watch__phone", sheet).appendChild(player());
      sheet.showModal();
      window.XH.track("tiktok_play", vid + " (side)");
    });
  }

  /* ---------- Listen: Spotify's player beside the record ----------
     The Spotify link in content/config.js (an artist page, album or playlist) plays
     here with its own track list. Whatever song is playing, the record slides back
     into its sleeve and comes out with that song's name on it. */
  const S = window.SITE || {};
  const sp = String((S.links || {}).spotify || "").match(/open\.spotify\.com\/(?:intl-\w+\/)?(artist|album|playlist|track)\/(\w+)/);
  const listen = $(".listen");
  if (sp) {
    listen.innerHTML = `<div class="listen__player"></div>`;
    listen.hidden = false;
    document.body.classList.add("has-listen");
    // phones: the player moves under the opening, where there's room for it
    const narrow = matchMedia("(max-width: 960px)"), pin = $(".stage__pin"), slot = $(".listen-slot");
    const seat = () => (narrow.matches ? slot : pin).appendChild(listen);
    seat(); narrow.addEventListener("change", seat);

    const record = $(".stage__record"), label = $(".sleeve__title"), names = {};
    let playing = "";
    const nameOf = (uri) => names[uri] || (names[uri] = fetch("https://open.spotify.com/oembed?url=" + encodeURIComponent(uri))
      .then((r) => r.json()).then((j) => j.title || "").catch(() => ""));
    function relabel(uri) {
      playing = uri;
      nameOf(uri).then((title) => {
        if (!title || uri !== playing) return;
        record.classList.add("is-changing"); // the record goes back in its sleeve…
        setTimeout(() => { label.textContent = title; record.classList.remove("is-changing"); }, reduced ? 0 : 450); // …and comes out labelled
        window.XH.track("song_play", title);
      });
    }
    // the full player with its track list where there's room (phones, big screens); the slim one on laptops, so it clears the name
    const tall = narrow.matches || matchMedia("(min-width: 1280px) and (min-height: 880px)").matches;
    document.body.style.setProperty("--listen-h", (tall ? 352 : 152) + "px");
    window.onSpotifyIframeApiReady = (API) => {
      API.createController($(".listen__player", listen), { uri: `spotify:${sp[1]}:${sp[2]}`, width: "100%", height: tall ? 352 : 152 }, (c) => {
        // Spotify makes its frame lazy-load, which never starts inside the pinned opening
        const f = $("iframe", listen);
        if (f && f.loading === "lazy") { f.loading = "eager"; f.src = f.src; }
        c.addListener("playback_update", (e) => {
          const d = e.data || {};
          record.classList.toggle("is-spinning", !d.isPaused);
          if (d.playingURI && d.playingURI !== playing && /^spotify:track:/.test(d.playingURI)) relabel(d.playingURI);
        });
      });
    };
    const js = document.createElement("script");
    js.src = "https://open.spotify.com/embed/iframe-api/v1";
    js.async = true;
    document.body.appendChild(js);
  }

  /* ---------- Bio: the lines arrive one after another ---------- */
  const sheet = $(".reveal");
  $(".sheet").style.cssText += paper(5, "tb", 1.6);
  if (sheet && "IntersectionObserver" in window && !reduced) {
    sheet.classList.add("reveal--armed");
    new IntersectionObserver((entries, io) => {
      if (entries[0].isIntersecting) { sheet.classList.add("in"); io.disconnect(); }
    }, { threshold: 0.35 }).observe(sheet);
  }

  /* ---------- The fan wall: two belts drifting opposite ways (content/fanwall.js) ---------- */
  const handle = ((S.links || {}).tiktok || "").match(/@[^/?]+/);
  const send = $("[data-fan-send]");
  send.href = `mailto:${S.contactEmail}?subject=${encodeURIComponent("For the fan wall")}&body=${encodeURIComponent("Attach your photo, drawing or video, and tell me your @ so I can credit you.\n\n")}`;
  if (handle) send.insertAdjacentHTML("afterend", ` <span class="fanwall__or">or tag <a href="${esc(S.links.tiktok)}" target="_blank" rel="noopener" data-track="tiktok">${esc(handle[0])}</a></span>`);

  const pieces = (window.FAN_WALL || []).filter((f) => f && (f.src || f.text));
  const waiting = ["your selfie with Xander", "your drawing", "your cover", "the comment you left", "your concert photo", "your edit"];
  // while the wall is young, empty frames fill it out and ask for more
  const items = pieces.slice();
  for (let i = 0; items.length < 8; i++) items.push({ type: "empty", text: waiting[i % waiting.length] });
  const piece = (f) => {
    const by = esc(f.by || "");
    if (f.type === "comment") return `<blockquote class="fw fw--note"><p>“${esc(f.text)}”</p><cite>${by}${f.from ? " on " + esc(f.from) : ""}</cite></blockquote>`;
    if (f.type === "empty") return `<div class="fw fw--empty${f.text.length > 14 ? " is-wide" : ""}"><span>${esc(f.text)}</span></div>`;
    const art = f.type === "art";
    return `<figure class="fw fw--${art ? "art" : "photo"}">${art ? '<span class="tp" style="--r:-3deg"></span>' : ""}
      <img src="${esc(f.src)}" alt="${art ? "Fan art" : "Fan photo"}${by ? " from " + by : ""}" decoding="async">
      <figcaption>${by ? `<b>${art ? "art by " : ""}${by}</b>` : ""}${f.note ? `<span>${esc(f.note)}</span>` : ""}</figcaption></figure>`;
  };
  const belts = $(".belts");
  function buildBelts() {
    const one = pieces.length < 8 && matchMedia("(max-width: 560px)").matches;
    const rows = one ? [items] : [items.filter((_, i) => i % 2 === 0), items.filter((_, i) => i % 2 === 1)];
    belts.innerHTML = rows.map((row, r) => {
      let set = row.slice();
      while (set.length < 8) set = set.concat(row); // long enough to cross a wide screen
      const html = set.map(piece).join("");
      return `<div class="belt${r ? " belt--back" : ""}"><div class="belt__track">
        <div class="belt__set">${html}</div><div class="belt__set" aria-hidden="true">${html}</div></div></div>`;
    }).join("");
    // a steady walking pace whatever the length: about 35px a second
    const pace = () => belts.querySelectorAll(".belt__track").forEach((t) => t.style.setProperty("--dur", `${Math.max(30, t.scrollWidth / 2 / 35)}s`));
    pace();
    belts.querySelectorAll("img").forEach((img) => img.addEventListener("load", pace, { once: true }));
    // stop moving while it's off screen
    new IntersectionObserver(([e]) => belts.classList.toggle("is-paused", !e.isIntersecting)).observe(belts);
  }
  // build it as it comes near, so the photos load right then
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries, io) => {
      if (entries[0].isIntersecting) { io.disconnect(); buildBelts(); }
    }, { rootMargin: "800px 0px" }).observe(belts);
  } else buildBelts();

  /* ---------- Song postcards ---------- */
  const songs = (window.MERCH || []).filter((m) => !m.featured);
  const rail = $(".songs__rail");
  rail.innerHTML = songs.map((m, i) => window.XH.postcard(m, i)).join("");

  /* ---------- Shows: one stop per continent ---------- */
  const regions = window.TOUR || [];
  const line = $(".line"), panel = $("#stop-panel");
  line.innerHTML = regions.map((reg, i) => {
    const n = (reg.dates || []).length;
    return `<li><button type="button" data-i="${i}" aria-expanded="false" aria-controls="stop-panel">
      <i aria-hidden="true"></i>${esc(reg.name)}<small${n ? "" : ' class="is-empty"'}>${n ? `${n} show${n > 1 ? "s" : ""}` : "No dates yet"}</small></button></li>`;
  }).join("");
  line.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]");
    if (!b) return;
    const open = b.getAttribute("aria-expanded") === "true";
    line.querySelectorAll("button").forEach((x) => x.setAttribute("aria-expanded", "false"));
    if (open) { panel.innerHTML = ""; return; }
    b.setAttribute("aria-expanded", "true");
    const reg = regions[+b.dataset.i], dates = reg.dates || [];
    panel.innerHTML = dates.length
      ? dates.map((d, i) => window.XH.dateCard(d, i)).join("")
      : `<article class="stub-empty paper" style="${paper(+b.dataset.i + 60, "lr", 1.2)}">
          <span class="label">Stop: ${esc(reg.name)}</span>
          <h3>Not in ${esc(reg.name)} yet.</h3>
          <p>Join the list and you'll hear first when a show lands here.</p>
          <a class="btn btn--hit btn--sm" href="#join" data-join>Join the list</a>
        </article>`;
    window.XH.track("region_open", { region: reg.id });
  });
})();
