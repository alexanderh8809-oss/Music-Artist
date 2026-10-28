/* Lobby: the skyline, its depth on scroll, the bio reveal, song postcards
   and the subway line of shows. */
(function () {
  const { $, esc, rng, paper } = window.XH;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Skyline: three layers of New York, drawn once ---------- */
  // Rooftops with water towers in front, one stepped spire behind, a few lit windows
  function skyline(svg, seed, { towers = 0, spire = false, windows = 0 }) {
    const r = rng(seed), W = 1200, H = 300;
    let x = 0, out = "", lit = "";
    while (x < W) {
      const w = 34 + r() * 70, h = 70 + r() * 190, top = H - h;
      out += `<rect x="${x.toFixed(0)}" y="${top.toFixed(0)}" width="${(w + 1).toFixed(0)}" height="${h.toFixed(0)}"/>`;
      if (r() < 0.3) out += `<rect x="${(x + w * 0.2).toFixed(0)}" y="${(top - 14).toFixed(0)}" width="${(w * 0.6).toFixed(0)}" height="15"/>`;
      if (towers && r() < towers) { // water tower: tank, cone, legs
        const tx = x + w * (0.25 + r() * 0.4), ty = top;
        out += `<rect x="${tx - 9}" y="${ty - 30}" width="18" height="22" rx="2"/><path d="M${tx - 11} ${ty - 30} L${tx} ${ty - 42} L${tx + 11} ${ty - 30}Z"/>` +
               `<rect x="${tx - 8}" y="${ty - 9}" width="2" height="9"/><rect x="${tx + 6}" y="${ty - 9}" width="2" height="9"/>`;
      }
      for (let k = 0; k < windows; k++) if (r() < 0.5) {
        lit += `<rect class="lit" x="${(x + 6 + r() * (w - 14)).toFixed(0)}" y="${(top + 12 + r() * (h - 30)).toFixed(0)}" width="4" height="6"/>`;
      }
      x += w;
    }
    if (spire) { // a stepped, Empire-ish tower
      const c = W * 0.62;
      out += `<path d="M${c - 46} ${H} V120 H${c - 30} V82 H${c - 16} V48 H${c - 6} V8 H${c + 6} V48 H${c + 16} V82 H${c + 30} V120 H${c + 46} V${H}Z"/>`;
    }
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = out + lit;
  }
  skyline($(".skyline--far"), 11, { spire: true });
  skyline($(".skyline--mid"), 23, { windows: 3 });
  skyline($(".skyline--near"), 37, { towers: 0.35, windows: 1 });

  /* ---------- Depth: layers drift apart as you scroll; photo tilts with the pointer ---------- */
  const hero = $(".hero");
  const layers = [
    [".hero__sun", 0.05], [".skyline--far", 0.1], [".skyline--mid", 0.2],
    [".hero__photo", 0.12], [".hero__reflection", 0.3], [".skyline--near", 0.34]
  ].map(([s, k]) => [$(s), k]);
  let px = 0, py = 0, raf = 0, visible = true;
  function paint() {
    raf = 0;
    const y = scrollY;
    layers.forEach(([el, k]) => {
      el.style.transform = `translate3d(${(px * k * 40).toFixed(1)}px, ${(y * k + py * k * 20).toFixed(1)}px, 0)`;
    });
  }
  const ask = () => { if (visible && !raf) raf = requestAnimationFrame(paint); };
  if (!reduced) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
    addEventListener("scroll", ask, { passive: true });
    if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
      hero.addEventListener("pointermove", (e) => {
        px = e.clientX / innerWidth - 0.5; py = e.clientY / innerHeight - 0.5; ask();
      });
      hero.addEventListener("pointerleave", () => { px = py = 0; ask(); });
    }
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
