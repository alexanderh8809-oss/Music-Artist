/* Journey page: a scrapbook board. Stages come from content/journey.js.
   View mode: scrolling glides a camera along the red string, easing into
   each stage. Edit mode (journey.html?edit): type into the boxes, then
   download journey.js. */
(function () {
  const { $, esc } = window.XH;
  const editing = new URLSearchParams(location.search).has("edit");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DRAFT = "xh_journey_draft2";

  const clone = (o) => JSON.parse(JSON.stringify(o));
  let board = clone(window.JOURNEY_BOARD || { background: "", scraps: [] });
  let stages = clone(window.JOURNEY || []);
  if (editing) {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT) || "null");
      if (d) { board = d.board; stages = d.stages; }
    } catch {}
  }
  const saveDraft = () => { try { localStorage.setItem(DRAFT, JSON.stringify({ board, stages })); } catch {} };

  const cam = $(".cam"), boardEl = $(".board"), world = $(".world"), track = $(".track");
  const counter = $(".ctl__count"), prevBtn = $(".ctl--prev"), nextBtn = $(".ctl--next");
  const pad = (n) => String(n).padStart(2, "0");
  const tilts = [-3, 2.5, -1.5, 3.2, -2.2];

  /* ---------- Pieces ---------- */
  // A text box: editable in edit mode, a dashed empty box in view mode until filled in
  function box(tag, cls, field, val, ph) {
    if (editing) return `<${tag} class="${cls}" contenteditable="plaintext-only" data-field="${field}" data-ph="${ph}">${esc(val)}</${tag}>`;
    if (val) return `<${tag} class="${cls}">${esc(val)}</${tag}>`;
    return tag === "p" ? `<p class="${cls} empty-box">${ph}</p>` : `<${tag} class="${cls}"><span class="empty-box">${ph}</span></${tag}>`;
  }

  // Paper scraps drawn in CSS, used until real scrap images are uploaded
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function drawn(kind, st, i) {
    const year = esc(st.year || "");
    if (kind === "news") return `<div class="news"><b>The Evening Edition</b><small><span>New York</span><span>${year || "Vol. " + (i + 1)}</span></small><i></i></div>`;
    if (kind === "ticket") return `<div class="ticket"><b>Admit One</b><span>Stage ${pad(i + 1)}${year ? " · " + year : ""}</span><em>No. ${String(950855 + i * 7919).slice(-6)}</em></div>`;
    if (kind === "cal") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => `<span>${d}</span>`).join("");
      const nums = Array.from({ length: 14 }, (_, k) => `<span>${k + 1}</span>`).join("");
      return `<div class="cal"><b>${months[(i * 5 + 3) % 12]}<span>${year}</span></b><i>${days}${nums}</i></div>`;
    }
    return `<div class="receipt"><b>THANK YOU</b>STAGE ${pad(i + 1)}<br>- - - - - - - - - -<br>TOTAL ........ 0.00<em>no receipts required</em></div>`;
  }
  function scraps(st, i) {
    const own = (st.scraps || []).filter(Boolean);
    const imgs = own.length ? own : (board.scraps || []).filter(Boolean);
    if (imgs.length) {
      const a = imgs[(i * 2) % imgs.length], b = imgs[(i * 2 + 1) % imgs.length];
      return `<img class="scrap scrap--a" src="${esc(a)}" alt="" loading="lazy">` +
             (imgs.length > 1 || own.length ? `<img class="scrap scrap--b" src="${esc(b)}" alt="" loading="lazy">` : "");
    }
    const kinds = ["news", "ticket", "cal", "receipt"];
    return `<div class="scrap scrap--a">${drawn(kinds[i % 4], st, i)}</div><div class="scrap scrap--b">${drawn(kinds[(i + 2) % 4], st, i)}</div>`;
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
  const img = (src, alt) => src ? `<img src="${esc(src)}" alt="${esc(alt || "Journey photo")}" loading="lazy">` : `<div class="ph" aria-hidden="true">Photo</div>`;

  function tools(st, i) {
    if (!editing) return "";
    const p = st.photos || [], s = st.scraps || [];
    return `<div class="tools" data-i="${i}">
      <label>Type
        <select data-tool="kind">
          <option value="postcard"${st.kind !== "video" ? " selected" : ""}>Photo (smaller moment)</option>
          <option value="video"${st.kind === "video" ? " selected" : ""}>Video (bigger moment)</option>
        </select></label>
      ${st.kind === "video" ? `<label>Video <input data-tool="video" value="${esc(st.video || "")}" placeholder="YouTube link or images/journey/clip.mp4"></label>` : ""}
      <label>Photo 1 <input data-tool="photo0" value="${esc(p[0] || "")}" placeholder="images/journey/photo.jpg"></label>
      <label>Photo 2 <input data-tool="photo1" value="${esc(p[1] || "")}" placeholder="optional"></label>
      <label>Scraps behind, this stage only <input data-tool="scraps" value="${esc(s.join(", "))}" placeholder="optional, e.g. images/journey/board/ticket.png"></label>
      <div class="tools__row">
        <button type="button" data-tool="up">Move up</button>
        <button type="button" data-tool="down">Move down</button>
        <button type="button" data-tool="delete">Delete stage</button>
      </div>
    </div>`;
  }

  function stageHTML(st, i) {
    const photos = (st.photos || []).filter(Boolean);
    const r = tilts[i % tilts.length];
    const caption = box("figcaption", "", "title", st.title, "Stage title");
    let main, second;
    if (st.kind === "video") {
      main = `<figure class="polaroid polaroid--wide" style="--r:${r / 2}deg"><span class="pin"></span><div class="screen">${media(st)}</div>${caption}</figure>`;
      second = photos[0];
    } else {
      main = `<figure class="polaroid" style="--r:${r}deg"><span class="pin"></span>${img(photos[0], st.title)}${caption}</figure>`;
      second = photos[1];
    }
    const small = second ? `<figure class="polaroid polaroid--small">${img(second, st.title)}</figure>` : "";
    const marker = editing
      ? `<div class="marker" contenteditable="plaintext-only" data-field="note" data-ph="Optional red note, like a lyric">${esc(st.note || "")}</div>`
      : st.note ? `<div class="marker"><span>${esc(st.note)}</span></div>` : "";
    return `<article class="stop${i % 2 ? " flip" : ""}" data-i="${i}">
      ${scraps(st, i)}
      ${main}${small}${marker}
      <div class="note">
        <p class="note__label">Stage ${pad(i + 1)}</p>
        ${box("p", "note__year", "year", st.year, "Year")}
        ${box("p", "note__text", "text", st.text, "Write about this stage.")}
      </div>
      ${tools(st, i)}
    </article>`;
  }

  const intro = `<section class="stop" data-stop="intro">
      <div class="scrap scrap--a">${drawn("cal", {}, 0)}</div>
      <div class="masthead"><span class="pin"></span>
        <small><span>Vol. I</span><span>New York</span></small>
        <h1>The Journey</h1>
        <p>Follow the string. Scroll, or press the button.</p>
        <i></i>
      </div>
    </section>`;
  const outro = `<section class="stop" data-stop="outro">
      <div class="scrap scrap--b">${drawn("ticket", {}, 8)}</div>
      <div class="end"><span class="pin"></span>
        <h2>to be continued&hellip;</h2>
        <a class="btn btn--sig" href="#join" data-join>Get the next chapter first</a>
      </div>
    </section>`;
  const editIntro = () => `<section class="stop">
      <div class="tools">
        <h3>Edit your journey</h3>
        <p>Type into the dashed boxes. For pictures, upload them to <b>images/journey/</b> on GitHub (or send them to Claude) and type the path, like <b>images/journey/first-show.jpg</b>. When you're done, press <b>Download journey.js</b>. Your edits stay in this browser until then.</p>
        <label>Board background (the wall) <input data-board="background" value="${esc(board.background || "")}" placeholder="images/journey/board/bookshelf.jpg"></label>
        <label>Paper scraps behind photos, separated by commas <input data-board="scraps" value="${esc((board.scraps || []).join(", "))}" placeholder="images/journey/board/newspaper.png, images/journey/board/ticket.png"></label>
      </div>
    </section>`;

  /* ---------- Render ---------- */
  let els = [], boxes = [], frames = [], H = 1, cur = null, target = null, raf = 0;

  function render() {
    if (board.background) {
      boardEl.style.backgroundImage = `url("${encodeURI(board.background)}")`;
      boardEl.classList.add("has-photo");
    } else {
      boardEl.style.backgroundImage = "";
      boardEl.classList.remove("has-photo");
    }
    const body = stages.map(stageHTML).join("");
    world.innerHTML = editing ? editIntro() + body : `<svg class="string" aria-hidden="true"></svg>` + intro + body + outro;
    els = [...world.querySelectorAll(".stop")];
    if (editing) {
      world.style.setProperty("--u", Math.min(440, cam.clientWidth * 0.84) / 100 + "px");
    } else {
      layout();
      onScroll();
    }
  }

  /* ---------- Board layout ---------- */
  const availH = () => cam.clientHeight - 84; // room for the controls

  function layout() {
    const vw = cam.clientWidth;
    const C = Math.min(440, vw * 0.8);
    world.style.setProperty("--u", C / 100 + "px");
    world.style.transform = "none";

    let y = C * 0.25;
    boxes = els.map((el, i) => {
      const x = C * 0.3 + (i % 2 ? C * 0.62 : 0);
      el.style.transform = `translate(${x}px, ${y}px)`;
      const h = el.offsetHeight;
      const b = { x, y, w: C, h, cx: x + C / 2, cy: y + h / 2 };
      y += h + C * 0.34;
      return b;
    });
    const ww = C * 2.2, wh = y;
    world.style.width = ww + "px";
    world.style.height = wh + "px";

    // red string through every pin, with a little sag
    const wr = world.getBoundingClientRect();
    const pins = els.map((el) => {
      const r = el.querySelector(".pin").getBoundingClientRect();
      return [r.left - wr.left + r.width / 2, r.top - wr.top + r.height / 2];
    });
    const svg = $(".string", world);
    svg.setAttribute("viewBox", `0 0 ${ww} ${wh}`);
    svg.style.width = ww + "px"; svg.style.height = wh + "px";
    svg.innerHTML = pins.slice(1).map(([x2, y2], k) => {
      const [x1, y1] = pins[k];
      const sag = Math.hypot(x2 - x1, y2 - y1) * 0.07;
      return `<path d="M${x1},${y1} Q${(x1 + x2) / 2},${(y1 + y2) / 2 + sag} ${x2},${y2}"/>`;
    }).join("");

    frames = boxes.map((b) => Math.min(1, (availH() - 30) / b.h, (vw - 16) / (b.w * 1.2)));

    // one screen of scrolling per stage, with soft snap points
    H = Math.max(420, cam.clientHeight * 0.95);
    track.style.height = (els.length - 1) * H + innerHeight + "px";
    const off = track.offsetTop; // snap points are measured from the page top, under the header
    track.innerHTML = els.map((_, i) => `<i style="top:${i * H - off}px"></i>`).join("");
  }

  /* ---------- Camera: follows the scroll, eases into each stage ---------- */
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (f) => (f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2);

  function frameAt(p) {
    const last = els.length - 1;
    p = Math.max(0, Math.min(last, p));
    const i = Math.min(Math.floor(p), Math.max(last - 1, 0)), f = last ? p - i : 0;
    const A = boxes[i], B = boxes[Math.min(i + 1, last)];
    const e = ease(f);
    const dip = reduced ? 0 : Math.sin(Math.PI * f) * 0.16; // drift back a little between stages
    const s = lerp(frames[i], frames[Math.min(i + 1, last)], e) * (1 - dip);
    const cx = lerp(A.cx, B.cx, e), cy = lerp(A.cy, B.cy, e);
    return { s, tx: cam.clientWidth / 2 - s * cx, ty: availH() / 2 - s * cy + 8 };
  }

  function apply(t) {
    world.style.transform = `translate3d(${t.tx}px, ${t.ty}px, 0) scale(${t.s})`;
    boardEl.style.backgroundPosition = `${t.tx * 0.25}px ${t.ty * 0.25}px`;
  }

  let lastT = 0;
  function tick(now) {
    const dt = Math.min(64, now - (lastT || now)); lastT = now;
    const k = 1 - Math.pow(1 - 0.14, dt / 16.7);
    cur = { s: lerp(cur.s, target.s, k), tx: lerp(cur.tx, target.tx, k), ty: lerp(cur.ty, target.ty, k) };
    apply(cur);
    const done = Math.abs(cur.tx - target.tx) < 0.1 && Math.abs(cur.ty - target.ty) < 0.1 && Math.abs(cur.s - target.s) < 0.0005;
    if (done) { apply((cur = target)); raf = 0; lastT = 0; } else raf = requestAnimationFrame(tick);
  }

  let shown = -1;
  function onScroll() {
    const p = scrollY / H;
    target = frameAt(p);
    if (!cur || reduced) { apply((cur = target)); }
    else if (!raf) raf = requestAnimationFrame(tick);

    const idx = Math.max(0, Math.min(els.length - 1, Math.round(p))), last = els.length - 1;
    if (idx !== shown) {
      shown = idx;
      counter.textContent = idx === 0 ? "Start" : idx === last ? "End" : `${pad(idx)} / ${pad(stages.length)}`;
      prevBtn.disabled = idx === 0;
      nextBtn.disabled = idx === last;
      window.XH.track("journey_stage", { stage: idx });
    }
  }
  const goTo = (i) => scrollTo({ top: Math.max(0, i) * H, behavior: reduced ? "auto" : "smooth" });

  if (!editing) {
    addEventListener("scroll", onScroll, { passive: true });
    nextBtn.addEventListener("click", () => goTo(shown + 1));
    prevBtn.addEventListener("click", () => goTo(shown - 1));
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    scrollTo(0, 0);
    let rt;
    const relayout = () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        const p = scrollY / H, oldH = H;
        layout();
        if (H !== oldH) scrollTo({ top: p * H, behavior: "instant" }); // only when the screen size changed
        onScroll();
      }, 120);
    };
    addEventListener("resize", relayout);
    world.addEventListener("load", relayout, true); // photos change sizes once loaded
    document.fonts && document.fonts.ready.then(relayout);
  }

  // Click-to-load YouTube (keeps the page fast, nothing plays until tapped)
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
  const paths = (v) => v.split(",").map((s) => s.trim()).filter(Boolean);
  if (editing) {
    document.body.classList.add("is-editing");
    $(".editbar").hidden = false;
    $(".controls").hidden = true;

    world.addEventListener("input", (e) => {
      const f = e.target.closest("[data-field]");
      if (!f) return;
      stages[+f.closest(".stop").dataset.i][f.dataset.field] = f.innerText.trim();
      saveDraft();
    });
    world.addEventListener("change", (e) => {
      const bf = e.target.closest("[data-board]");
      if (bf) {
        board[bf.dataset.board] = bf.dataset.board === "scraps" ? paths(bf.value) : bf.value.trim();
        saveDraft(); render(); return;
      }
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
      if (tool === "scraps") st.scraps = paths(t.value);
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
        stages.push({ kind: "postcard", year: "", title: "", text: "", note: "", photos: [], video: "", scraps: [] });
        saveDraft(); render();
        els[els.length - 1].scrollIntoView({ behavior: "smooth", block: "center" });
      }
      if (act === "download") download();
      if (act === "reset" && confirm("Discard your edits and go back to the published journey?")) {
        try { localStorage.removeItem(DRAFT); } catch {}
        board = clone(window.JOURNEY_BOARD || { background: "", scraps: [] });
        stages = clone(window.JOURNEY || []);
        render();
      }
    });
  }

  function download() {
    const cleanBoard = { background: board.background || "", scraps: (board.scraps || []).filter(Boolean) };
    const clean = stages.map((s) => ({
      kind: s.kind === "video" ? "video" : "postcard",
      year: s.year || "", title: s.title || "", text: s.text || "", note: s.note || "",
      photos: (s.photos || []).filter(Boolean), video: s.video || "", scraps: (s.scraps || []).filter(Boolean)
    }));
    const head = `/* ============================================================
   JOURNEY — a scrapbook board, earliest stage at the top.
   Edit on journey.html?edit, then "Download journey.js".

   kind:   "postcard" for smaller moments, "video" for bigger ones
   note:   optional red handwritten strip, e.g. a lyric
   photos: up to 2 image paths; video: a YouTube link or .mp4 path
   scraps: paper bits behind the photos (board-wide or per stage)
   ============================================================ */
`;
    const text = head +
      "window.JOURNEY_BOARD = " + JSON.stringify(cleanBoard, null, 2) + ";\n\n" +
      "window.JOURNEY = " + JSON.stringify(clean, null, 2) + ";\n";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/javascript" }));
    a.download = "journey.js";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  render();
})();
