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
  $(".stage__now").innerHTML = window.XH.soundButton;

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
    const player = () => {
      const f = document.createElement("iframe");
      f.src = `https://www.tiktok.com/player/v1/${vid}?autoplay=1&rel=0&description=0&music_info=0`;
      f.allow = "autoplay; fullscreen; encrypted-media; picture-in-picture";
      f.title = F.title ? `${F.title} on TikTok` : "TikTok video";
      return f;
    };
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

  /* ---------- Bio: the lines arrive one after another ---------- */
  const sheet = $(".reveal");
  $(".sheet").style.cssText += paper(5, "tb", 1.6);
  if (sheet && "IntersectionObserver" in window && !reduced) {
    sheet.classList.add("reveal--armed");
    new IntersectionObserver((entries, io) => {
      if (entries[0].isIntersecting) { sheet.classList.add("in"); io.disconnect(); }
    }, { threshold: 0.35 }).observe(sheet);
  }

  /* ---------- Song postcards ---------- */
  const songs = (window.MERCH || []).filter((m) => !m.featured);
  const rail = $(".songs__rail");
  rail.innerHTML = songs.map((m, i) => window.XH.postcard(m, i)).join("");
  $(".songs__sound").innerHTML = window.XH.soundButton;
  // the card most in view is the one that plays (the first one to begin with)
  window.XH.player.focus(rail.querySelector(".pcard"));
  if ("IntersectionObserver" in window) {
    const seen = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target, e.intersectionRatio));
      let best = null, max = 0.6;
      seen.forEach((r, el) => { if (r > max) { max = r; best = el; } });
      if (best) window.XH.player.focus(best);
    }, { root: rail, threshold: [0.3, 0.6, 0.8, 1] });
    rail.querySelectorAll(".pcard").forEach((c) => io.observe(c));
  }

  /* ---------- Shows: one stop per continent ---------- */
  const regions = window.TOUR || [];
  const line = $(".line"), panel = $("#stop-panel");
  line.innerHTML = regions.map((reg, i) => {
    const n = (reg.dates || []).length;
    return `<li><button type="button" data-i="${i}" aria-expanded="false" aria-controls="stop-panel">
      <i aria-hidden="true"></i>${esc(reg.name)}<small>${n ? `${n} show${n > 1 ? "s" : ""}` : "No dates yet"}</small></button></li>`;
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
