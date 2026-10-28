/* Floor 2: the postcard spinner rack. Drag, swipe, arrow keys or buttons
   turn it; the card facing you flips when tapped, the others spin round. */
(function () {
  const { $, esc, paper } = window.XH;
  const all = window.MERCH || [];
  const cards = all.filter((m) => !m.featured), set = all.find((m) => m.featured);
  const rack = $(".rack"), stage = $(".rack__stage"), spin = $(".rack__spin"), now = $(".rack__now");
  const flat = matchMedia("(prefers-reduced-motion: reduce)").matches || !CSS.supports("transform-style", "preserve-3d");

  $(".rack__sound").innerHTML = window.XH.soundButton;
  spin.innerHTML = cards.map((m, i) => `<div class="rack__slot" data-i="${i}">${window.XH.postcard(m, i)}</div>`).join("");
  const slots = [...spin.children], n = slots.length, step = 360 / n;
  let angle = 0, R = 0;

  function place() {
    const w = slots[0].offsetWidth;
    R = Math.round(w / 2 / Math.tan(Math.PI / n) + 18);
    slots.forEach((s, i) => { s.style.transform = `rotateY(${i * step}deg) translateZ(${R}px)`; });
    turn(angle, false);
  }
  const front = () => ((Math.round(-angle / step) % n) + n) % n;
  function turn(a, ease = true, dragging = false) { // while dragging, wait to pick the song
    angle = a;
    spin.classList.toggle("is-easing", ease);
    spin.style.transform = `translateZ(${-R}px) rotateY(${angle}deg)`;
    const f = front();
    slots.forEach((s, i) => {
      s.classList.toggle("is-front", i === f);
      if (i !== f) s.querySelector(".pcard").classList.remove("is-flipped");
    });
    now.innerHTML = `<b>${esc(cards[f].title)}</b>${esc(cards[f].number)} of ${pad(n)}`;
    if (!dragging) window.XH.player.focus(slots[f].querySelector(".pcard"));
  }
  const pad = (x) => String(x).padStart(2, "0");
  const snap = () => turn(Math.round(angle / step) * step);
  const go = (dir) => { turn(Math.round(angle / step) * step - dir * step); window.XH.track("rack_spin"); };

  if (flat) {
    rack.classList.add("is-flat");
    window.XH.player.focus(slots[0].querySelector(".pcard"));
    now.textContent = "";
  } else {
    place();
    addEventListener("resize", () => place());

    // drag to spin; a drag never counts as a tap
    let x0 = null, a0 = 0, moved = false;
    stage.addEventListener("pointerdown", (e) => {
      x0 = e.clientX; a0 = angle; moved = false;
    });
    addEventListener("pointermove", (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      if (!moved && Math.abs(dx) > 6) { moved = true; stage.classList.add("is-dragging"); }
      if (moved) turn(a0 + dx * 0.35, false, true);
    });
    addEventListener("pointerup", () => {
      if (x0 === null) return;
      x0 = null; stage.classList.remove("is-dragging");
      if (moved) snap();
    });
    // taps: the front card flips (handled site-wide); a side card spins to the front
    stage.addEventListener("click", (e) => {
      if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; return; }
      if (e.target.closest(".rack__slot.is-front")) return;
      const r = stage.getBoundingClientRect();
      go(e.clientX < r.left + r.width / 2 ? -1 : 1);
    }, true);
    stage.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    });
    $(".rack__controls").addEventListener("click", (e) => {
      const b = e.target.closest("[data-dir]");
      if (b) go(+b.dataset.dir);
    });
  }

  /* ---------- The full set ---------- */
  if (set) {
    const S = window.SITE || {};
    const href = set.buy || `mailto:${S.contactEmail}?subject=${encodeURIComponent(`Order: ${set.title} ($${set.price})`)}&body=${encodeURIComponent("Shipping name and address:\n\n")}`;
    $(".sleeve-wrap").innerHTML = `
      <article class="sleeve paper" style="${paper(91, "t", 2.2)}">
        <div>
          <span class="label">The full set</span>
          <h2>${esc(set.title)}</h2>
          <p>All seven cards, ${esc(set.number)}, in one paper sleeve.</p>
        </div>
        <div class="sleeve__buy">
          <span class="sleeve__price">$${Number(set.price).toFixed(0)}</span>
          <a class="btn btn--hit" href="${esc(href)}" data-track="buy_${esc(set.id)}"${set.buy ? ' target="_blank" rel="noopener"' : ""}>Buy the set</a>
        </div>
        <div class="sleeve__fan" aria-hidden="true">${"<span></span>".repeat(7)}</div>
      </article>`;
  }
})();
