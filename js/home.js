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
