/* Home page: continent slivers → swipeable rail of tour dates + merch. */
(function () {
  const { $, esc } = window.XH;
  const regions = window.TOUR || [];
  const merch = window.MERCH || [];
  const svg = $(".fan__svg");
  const fan = $(".fan");
  const NS = "http://www.w3.org/2000/svg";

  // Sunset-after-dark gradients (supporting colors only; orange stays out)
  const skies = [
    ["#eac392", "#7b6690"], ["#3b6fb6", "#131417"], ["#7b6690", "#1c1e23"],
    ["#2bb8a3", "#3b6fb6"], ["#eac392", "#3b6fb6"], ["#7b6690", "#eac392"]
  ];

  const apex = { x: 300, y: 540 }, R = 720, span = 118, gap = 1.8;
  const each = (span - gap * (regions.length - 1)) / regions.length;
  const pt = (deg, r) => {
    const a = (deg * Math.PI) / 180;
    return [apex.x + Math.sin(a) * r, apex.y - Math.cos(a) * r];
  };

  let defs = `<defs>`;
  let body = "";
  regions.forEach((reg, i) => {
    const a0 = -span / 2 + i * (each + gap), a1 = a0 + each, mid = (a0 + a1) / 2;
    const [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R);
    const d = `M${apex.x},${apex.y} L${x0.toFixed(1)},${y0.toFixed(1)} L${x1.toFixed(1)},${y1.toFixed(1)} Z`;
    const [c0, c1] = skies[i % skies.length];
    defs += `<linearGradient id="sky${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c0}"/><stop offset="1" stop-color="${c1}"/></linearGradient>`;
    let fill = `<path class="sliver__shape" d="${d}" fill="url(#sky${i})"/>`;
    if (reg.image) {
      defs += `<clipPath id="clip${i}"><path d="${d}"/></clipPath>`;
      fill = `<image href="${esc(reg.image)}" x="0" y="0" width="600" height="560" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip${i})"/>` +
             `<path class="sliver__shape" d="${d}" fill="transparent"/>`;
    }
    const [tx, ty] = pt(mid, 300);
    body += `
      <g class="sliver" data-i="${i}" role="button" tabindex="0" aria-label="${esc(reg.name)}" aria-controls="region">
        ${fill}
        <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" dominant-baseline="middle"
              transform="rotate(${(mid - 90).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)})">${esc(reg.name)}</text>
      </g>`;
  });
  svg.innerHTML = defs + `</defs>` + body;

  /* ---------- Region panel ---------- */
  const panel = $("#region"), rail = $(".rail", panel), nameEl = $(".region__name", panel);

  function inRegion(item, id) {
    const r = item.regions || ["all"];
    return r.includes("all") || r.includes(id);
  }

  function open(i) {
    const reg = regions[i];
    svg.querySelectorAll(".sliver").forEach((g) => {
      const on = +g.dataset.i === i;
      g.classList.toggle("is-on", on);
      g.setAttribute("aria-pressed", on);
    });
    fan.classList.add("has-pick");
    nameEl.textContent = reg.name;

    const upcoming = (reg.dates || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
    let html = upcoming.length
      ? upcoming.map(window.XH.dateCard).join("")
      : `<div class="empty">
           <span class="label">No dates yet</span>
           <h3>Not in ${esc(reg.name)} yet.</h3>
           <p>Join the list and you'll hear first when a show lands near you.</p>
           <a class="btn btn--sig btn--sm" href="#join" data-join>Tell me first</a>
         </div>`;
    const items = merch.filter((m) => inRegion(m, reg.id));
    if (items.length) html += `<span class="label rail__sub">Merch</span>` + items.map((m, k) => window.XH.postcard(m, k)).join("");
    rail.innerHTML = html;
    rail.scrollLeft = 0;

    const firstOpen = panel.hidden;
    panel.hidden = false;
    if (firstOpen) panel.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
    window.XH.track("pick_region", { region: reg.id });
  }

  svg.addEventListener("click", (e) => {
    const g = e.target.closest(".sliver");
    if (g) open(+g.dataset.i);
  });
  svg.addEventListener("keydown", (e) => {
    const g = e.target.closest(".sliver");
    if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(+g.dataset.i); }
  });

  panel.querySelectorAll(".region__arrow").forEach((b) =>
    b.addEventListener("click", () => {
      const card = rail.firstElementChild;
      const step = card ? card.getBoundingClientRect().width + 16 : 300;
      rail.scrollBy({ left: step * +b.dataset.dir, behavior: "smooth" });
    })
  );
})();
