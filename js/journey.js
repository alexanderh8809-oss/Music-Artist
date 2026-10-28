/* Journey page. Stages come from content/journey.js.
   View mode: a camera zooms diagonally down from stage to stage.
   Edit mode (journey.html?edit): type into the boxes, then download journey.js. */
(function () {
  const { $, esc } = window.XH;
  const editing = new URLSearchParams(location.search).has("edit");
  const DRAFT = "xh_journey_draft";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const original = () => JSON.parse(JSON.stringify(window.JOURNEY || []));
  let stages = original();
  if (editing) {
    try { const d = localStorage.getItem(DRAFT); if (d) stages = JSON.parse(d); } catch {}
  }
  const saveDraft = () => { try { localStorage.setItem(DRAFT, JSON.stringify(stages)); } catch {} };

  const cam = $(".cam"), world = $(".world");
  const counter = $(".ctl__count"), prevBtn = $(".ctl--prev"), nextBtn = $(".ctl--next");
  const tilts = [-1.4, 1.1, -0.8, 1.5];
  const pad = (n) => String(n).padStart(2, "0");

  /* ---------- Rendering ---------- */
  // A text box: editable in edit mode, a dashed empty box in view mode until filled in
  function box(tag, cls, field, val, ph) {
    if (editing) return `<${tag} class="${cls}" contenteditable="plaintext-only" data-field="${field}" data-ph="${ph}">${esc(val)}</${tag}>`;
    if (val) return `<${tag} class="${cls}">${esc(val)}</${tag}>`;
    return tag === "p" ? `<p class="${cls} empty-box">${ph}</p>` : `<${tag} class="${cls}"><span class="empty-box">${ph}</span></${tag}>`;
  }

  function photos(st, required) {
    const list = (st.photos || []).filter(Boolean).slice(0, 2);
    if (!list.length) return required ? `<div class="photos photos--1"><div class="ph" aria-hidden="true">Photo</div></div>` : "";
    return `<div class="photos photos--${list.length}">${list.map((src) => `<img src="${esc(src)}" alt="${esc(st.title || "Journey photo")}" loading="lazy">`).join("")}</div>`;
  }

  const ytId = (u) => (String(u).match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([\w-]{11})/) || [])[1];
  function media(st) {
    const v = (st.video || "").trim();
    if (!v) return `<div class="ph ph--c" aria-hidden="true">Video</div>`;
    const id = ytId(v);
    if (id) return `<button class="yt" type="button" data-yt="${id}" aria-label="Play video${st.title ? ": " + esc(st.title) : ""}">
        <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy"><span class="yt__play" aria-hidden="true">&#9654;</span></button>`;
    return `<video src="${esc(v)}" controls preload="metadata" playsinline></video>`;
  }

  function tools(st, i) {
    if (!editing) return "";
    const p = st.photos || [];
    return `<div class="tools" data-i="${i}">
      <label>Type
        <select data-tool="kind">
          <option value="postcard"${st.kind !== "video" ? " selected" : ""}>Postcard (smaller moment)</option>
          <option value="video"${st.kind === "video" ? " selected" : ""}>Video (bigger moment)</option>
        </select></label>
      <label>Photo 1 <input data-tool="photo0" value="${esc(p[0] || "")}" placeholder="images/journey/photo.jpg"></label>
      <label>Photo 2 <input data-tool="photo1" value="${esc(p[1] || "")}" placeholder="optional"></label>
      ${st.kind === "video" ? `<label>Video <input data-tool="video" value="${esc(st.video || "")}" placeholder="YouTube link or images/journey/clip.mp4"></label>` : ""}
      <div class="tools__row">
        <button type="button" data-tool="up">Move up</button>
        <button type="button" data-tool="down">Move down</button>
        <button type="button" data-tool="delete">Delete stage</button>
      </div>
    </div>`;
  }

  function stageHTML(st, i) {
    const n = pad(i + 1);
    if (st.kind === "video") {
      return `<article class="stage stage--video" data-i="${i}">
        <div class="frame">
          <span class="tape tape--plain frame__tape frame__tape--l" aria-hidden="true"></span>
          <span class="tape tape--plain frame__tape frame__tape--r" aria-hidden="true"></span>
          <div class="screen">${media(st)}</div>
          <div class="frame__body">
            <span class="label">Stage ${n} · ${box("span", "", "year", st.year, "Year")}</span>
            ${box("h2", "", "title", st.title, "Stage title")}
            ${box("p", "", "text", st.text, "Write about this stage.")}
          </div>
          ${photos(st, false)}
        </div>
        ${tools(st, i)}
      </article>`;
    }
    return `<article class="stage stage--postcard" data-i="${i}">
      <div class="card" style="--tilt:${tilts[i % tilts.length]}deg">
        <span class="tape tape--plain card__tape" aria-hidden="true"></span>
        ${photos(st, true)}
        <div class="card__body">
          ${box("div", "card__stamp", "year", st.year, "Year")}
          <span class="label">Stage ${n}</span>
          ${box("h2", "", "title", st.title, "Stage title")}
          ${box("p", "", "text", st.text, "Write about this stage.")}
          <div class="card__lines" aria-hidden="true"></div>
        </div>
      </div>
      ${tools(st, i)}
    </article>`;
  }

  const intro = `<section class="stage stop" data-stop="intro">
      <span class="tape">Journey</span>
      <h1>Stage by stage.</h1>
      <p>From the first song to now. Press the button to move to the next stage.</p>
    </section>`;
  const outro = `<section class="stage stop" data-stop="outro">
      <span class="label">Up next</span>
      <h2>To be continued.</h2>
      <a class="btn btn--sig" href="#join" data-join>Get the next chapter first</a>
    </section>`;
  const editIntro = `<section class="stage stop">
      <span class="tape">Edit mode</span>
      <h2>Your journey.</h2>
      <p>Type into the dashed boxes. For photos, upload them to <b>images/journey/</b> on GitHub and type the path, like <b>images/journey/first-show.jpg</b>. When you're done, press <b>Download journey.js</b> and upload it to the <b>content</b> folder on GitHub. Your edits are kept in this browser until then.</p>
    </section>`;

  let els = [], boxes = [], here = 0, cur = { tx: 0, ty: 0, s: 1 }, anim = null;

  function render() {
    const body = stages.map(stageHTML).join("");
    world.innerHTML = editing ? editIntro + body : `<svg class="string" aria-hidden="true"></svg>` + intro + body + outro;
    els = [...world.querySelectorAll(".stage")];
    if (!editing) { layout(); go(Math.min(here, els.length - 1), false); }
  }

  /* ---------- Camera ---------- */
  function layout() {
    const vw = cam.clientWidth, vh = cam.clientHeight;
    const W = Math.min(560, vw * 0.86);
    const gapY = Math.max(160, vh * 0.32);
    let y = 0;
    boxes = els.map((el, i) => {
      const w = el.classList.contains("stage--postcard") ? W * 0.9 : W;
      el.style.width = w + "px";
      const x = (i % 2 ? W * 0.8 : 0) + (W - w) / 2;
      const h = el.offsetHeight;
      el.style.transform = `translate(${x}px, ${y}px)`;
      const b = { x, y, w, h };
      y += h + gapY;
      return b;
    });
    const ww = W * 1.8, wh = y;
    world.style.width = ww + "px";
    world.style.height = wh + "px";
    const svg = $(".string", world);
    svg.setAttribute("viewBox", `0 0 ${ww} ${wh}`);
    svg.style.width = ww + "px"; svg.style.height = wh + "px";
    // a dotted string from the bottom of each stage to a pin on top of the next
    svg.innerHTML = boxes.slice(1).map((b, k) => {
      const a = boxes[k], x1 = a.x + a.w / 2, y1 = a.y + a.h + 10, x2 = b.x + b.w / 2, y2 = b.y - 8;
      return `<polyline points="${x1},${y1} ${x2},${y2}"/><circle cx="${x2}" cy="${y2}" r="6"/>`;
    }).join("");
  }

  const tf = (t) => `translate(${t.tx}px, ${t.ty}px) scale(${t.s})`;
  function frameFor(b, sMax = 1) {
    const vw = cam.clientWidth, vh = cam.clientHeight - 80; // leave room for the controls
    const s = Math.min(sMax, (vh - 40) / b.h, (vw - 24) / b.w);
    return { s, tx: vw / 2 - s * (b.x + b.w / 2), ty: vh / 2 - s * (b.y + b.h / 2) };
  }

  function go(i, animate = true) {
    i = Math.max(0, Math.min(els.length - 1, i));
    const to = frameFor(boxes[i]);
    if (animate && !reduced && i !== here) {
      const a = boxes[here], b = boxes[i];
      const mid = frameFor({
        x: Math.min(a.x, b.x), y: Math.min(a.y, b.y),
        w: Math.max(a.x + a.w, b.x + b.w) - Math.min(a.x, b.x),
        h: Math.max(a.y + a.h, b.y + b.h) - Math.min(a.y, b.y)
      }, Math.min(cur.s, to.s) * 0.8);
      if (anim) anim.cancel();
      anim = world.animate([{ transform: tf(cur) }, { transform: tf(mid) }, { transform: tf(to) }],
        { duration: 1300, easing: "cubic-bezier(.65,0,.35,1)" });
    }
    world.style.transform = tf(to);
    cur = to;
    els.forEach((el, k) => { el.classList.toggle("is-here", k === i); el.inert = k !== i; });
    here = i;
    const last = els.length - 1;
    counter.textContent = i === 0 ? "Start" : i === last ? "End" : `${pad(i)} / ${pad(stages.length)}`;
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === last;
    if (animate) window.XH.track("journey_stage", { stage: i });
  }

  /* ---------- Input ---------- */
  if (!editing) {
    nextBtn.addEventListener("click", () => go(here + 1));
    prevBtn.addEventListener("click", () => go(here - 1));
    addEventListener("keydown", (e) => {
      if (e.target.closest("input, textarea, [contenteditable], dialog")) return;
      if (["ArrowDown", "ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); go(here + 1); }
      if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); go(here - 1); }
    });
    let lastWheel = 0;
    cam.addEventListener("wheel", (e) => {
      e.preventDefault();
      const now = Date.now();
      if (Math.abs(e.deltaY) < 20 || now - lastWheel < 1100) return;
      lastWheel = now;
      go(here + (e.deltaY > 0 ? 1 : -1));
    }, { passive: false });
    let startY = null;
    cam.addEventListener("touchstart", (e) => { startY = e.touches[0].clientY; }, { passive: true });
    cam.addEventListener("touchend", (e) => {
      if (startY == null) return;
      const dy = startY - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 50) go(here + (dy > 0 ? 1 : -1));
      startY = null;
    });
    let rt;
    addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { layout(); go(here, false); }, 120); });
    // photos change card heights once they load
    world.addEventListener("load", () => { layout(); go(here, false); }, true);
    document.fonts && document.fonts.ready.then(() => { layout(); go(here, false); });
  }

  // Click-to-load YouTube (keeps the page fast, no autoplay until tapped)
  world.addEventListener("click", (e) => {
    const b = e.target.closest(".yt");
    if (!b) return;
    const f = document.createElement("iframe");
    f.src = `https://www.youtube-nocookie.com/embed/${b.dataset.yt}?autoplay=1&rel=0`;
    f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    f.allowFullscreen = true;
    f.title = "Video";
    b.replaceWith(f);
  });

  /* ---------- Edit mode ---------- */
  if (editing) {
    document.body.classList.add("is-editing");
    $(".editbar").hidden = false;
    $(".controls").hidden = true;

    world.addEventListener("input", (e) => {
      const f = e.target.closest("[data-field]");
      if (!f) return;
      const i = +f.closest(".stage").dataset.i;
      stages[i][f.dataset.field] = f.innerText.trim();
      saveDraft();
    });
    world.addEventListener("change", (e) => {
      const t = e.target.closest("[data-tool]");
      if (!t) return;
      const st = stages[+t.closest(".tools").dataset.i];
      const tool = t.dataset.tool;
      if (tool === "kind") st.kind = t.value;
      if (tool === "photo0" || tool === "photo1") {
        st.photos = st.photos || [];
        st.photos[+tool.slice(-1)] = t.value.trim();
      }
      if (tool === "video") st.video = t.value.trim();
      saveDraft(); render();
    });
    world.addEventListener("click", (e) => {
      const t = e.target.closest("button[data-tool]");
      if (!t) return;
      const i = +t.closest(".tools").dataset.i;
      const tool = t.dataset.tool;
      if (tool === "up" && i > 0) [stages[i - 1], stages[i]] = [stages[i], stages[i - 1]];
      if (tool === "down" && i < stages.length - 1) [stages[i + 1], stages[i]] = [stages[i], stages[i + 1]];
      if (tool === "delete" && confirm("Delete this stage?")) stages.splice(i, 1);
      saveDraft(); render();
    });

    $(".editbar").addEventListener("click", (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "add") {
        stages.push({ kind: "postcard", year: "", title: "", text: "", photos: [], video: "" });
        saveDraft(); render();
        els[els.length - 1].scrollIntoView({ behavior: "smooth", block: "center" });
      }
      if (act === "download") download();
      if (act === "reset" && confirm("Discard your edits and go back to the published journey?")) {
        try { localStorage.removeItem(DRAFT); } catch {}
        stages = original(); render();
      }
    });
  }

  function download() {
    const clean = stages.map((s) => ({
      kind: s.kind === "video" ? "video" : "postcard",
      year: s.year || "", title: s.title || "", text: s.text || "",
      photos: (s.photos || []).filter(Boolean), video: s.video || ""
    }));
    const head = `/* ============================================================
   JOURNEY STAGES — top of the list is the earliest stage.

   EASIEST WAY TO EDIT: open journey.html?edit on your site,
   type into the boxes, press "Download journey.js", then upload
   that file here on GitHub (replacing this one).

   kind:   "postcard" for smaller moments, "video" for bigger ones
   photos: up to 2 image paths, e.g. ["images/journey/first-guitar.jpg"]
   video:  a YouTube link, or a path like "images/journey/show.mp4"
   ============================================================ */
`;
    const blob = new Blob([head + "window.JOURNEY = " + JSON.stringify(clean, null, 2) + ";\n"], { type: "text/javascript" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "journey.js";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  render();
})();
