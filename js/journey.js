/* Journey page: a scrapbook board. Stages come from content/journey.js.
   View mode: scrolling glides a camera along the red string, easing into
   each stage. Edit mode (journey.html?edit): type into the boxes, then
   download journey.js. */
(function () {
  const { $, esc, rng, paper } = window.XH;
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

  const bgsEl = $(".bgs");
  const cam = $(".cam"), boardEl = $(".board"), world = $(".world"), track = $(".track");
  const counter = $(".ctl__count"), prevBtn = $(".ctl--prev"), nextBtn = $(".ctl--next");
  const rail = $(".rail");
  const pad = (n) => String(n).padStart(2, "0");
  const tilts = [-3, 2.5, -1.5, 3.2, -2.2];

  // Age at a stage: typed in, or worked out from the birth year
  function ageOf(st) {
    if (String(st.age || "").trim()) return String(st.age).trim();
    const y = String(st.year || "").match(/\b(19|20)\d{2}\b/), b = parseInt(board.born, 10);
    return y && b ? String(+y[0] - b) : "";
  }

  /* ---------- Pieces ---------- */
  // A text box: editable in edit mode, a dashed empty box in view mode until filled in
  function box(tag, cls, field, val, ph) {
    if (editing) return `<${tag} class="${cls}" contenteditable="plaintext-only" data-field="${field}" data-ph="${ph}">${esc(val)}</${tag}>`;
    if (val) return `<${tag} class="${cls}">${esc(val)}</${tag}>`;
    return tag === "p" ? `<p class="${cls} empty-box">${ph}</p>` : `<${tag} class="${cls}"><span class="empty-box">${ph}</span></${tag}>`;
  }

  const tape = (seed) => { const r = rng(seed); return `<span class="tp" style="left:${20 + r() * 50}%;--r:${(r() * 16 - 8).toFixed(1)}deg"></span>`; };

  // Decorative paper drawn in CSS: one per stage, alongside your own scraps
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function drawn(kind, st, i) {
    const year = esc(st.year || "");
    if (kind === "ticket") return `<div class="ticket paper" style="${paper(i + 300, "lr", 1.2)}"><b>Admit One</b><span>Stage ${pad(i + 1)}${year ? " · " + year : ""}</span><em>No. ${String(950855 + i * 7919).slice(-6)}</em></div>`;
    if (kind === "cal") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => `<span>${d}</span>`).join("");
      const nums = Array.from({ length: 14 }, (_, k) => `<span>${k + 1}</span>`).join("");
      return `<div class="cal paper" style="${paper(i + 400, "tb", 2)}"><b>${months[(i * 5 + 3) % 12]}<span>${year}</span></b><i>${days}${nums}</i></div>`;
    }
    return `<div class="receipt paper" style="${paper(i + 500, "tb", 2.4)}"><b>THANK YOU</b>STAGE ${pad(i + 1)}<br>- - - - - - - - - -<br>TOTAL ........ 0.00<em>no receipts required</em></div>`;
  }

  // Your scraps: newspaper clippings (editable text) and photos behind each stage
  const norm = (s) => typeof s === "string" ? { type: "photo", src: s }
    : s && s.type === "news" ? { type: "news", headline: s.headline || "", text: s.text || "" }
    : { type: "photo", src: (s && s.src) || "" };
  const blankScraps = () => [{ type: "news", headline: "", text: "" }, { type: "photo", src: "" }, { type: "news", headline: "", text: "" }, { type: "photo", src: "" }];

  function scrapText(tag, cls, k, key, val, ph) {
    if (editing) return `<${tag} class="${cls}" contenteditable="plaintext-only" data-sf="${key}" data-ph="${ph}">${esc(val)}</${tag}>`;
    return val ? `<${tag} class="${cls}">${esc(val)}</${tag}>` : "";
  }
  function scrapHTML(s, st, i, k, pos) {
    const seed = i * 97 + k * 13;
    if (s.type === "news") {
      const head = scrapText("h4", "news__head", k, "headline", s.headline, "Headline");
      const body = scrapText("p", "news__body", k, "text", s.text, "Type the article here");
      const fake = !editing && !s.headline ? `<h4 class="news__head">The Evening Edition</h4>` : "";
      const lines = !editing && !s.text ? `<i class="news__lines"></i>` : "";
      return `<div class="scrap news paper" data-sk="${k}" style="${pos}${paper(seed, "trbl", 2)}">
        <small><span>New York</span><span>${esc(st.year || "")}</span></small>${fake}${head}${body}${lines}${k % 2 ? "" : tape(seed)}</div>`;
    }
    const pic = s.src ? `<img src="${esc(s.src)}" alt="" decoding="async">` : `<div class="ph" aria-hidden="true">Photo</div>`;
    return `<figure class="scrap print paper" data-sk="${k}" style="${pos}${paper(seed, k % 2 ? "b" : "r", 1.4)}">${pic}${tape(seed + 1)}</figure>`;
  }

  // Where scraps sit around a stage, in --u: x, y, width, tilt. Mirrored on flipped stages.
  const slots = {
    news:  [[42, -15, 62, 4], [-28, 64, 56, -6], [58, 100, 54, 5], [-20, -22, 48, -3]],
    photo: [[82, -16, 38, 6], [-30, 36, 38, -8], [78, 98, 38, 7], [-12, 124, 36, -5]],
    deco: [72, 136, 40, -4]
  };
  const place = ([x, y, w, r], flip, bump = 0) =>
    `left:calc(var(--u) * ${flip ? 100 - x - w : x});top:calc(var(--u) * ${y + bump});width:calc(var(--u) * ${w});transform:rotate(${flip ? -r : r}deg);`;

  function scraps(st, i) {
    const flip = i % 2 === 1, seen = { news: 0, photo: 0 };
    const list = st.scraps.length ? st.scraps : [{ type: "news", headline: "", text: "" }];
    // real photos take the slots that peek out furthest; empty frames go behind
    const rank = new Map(list.map((s, k) => [k, s]).filter(([, s]) => s.type === "photo")
      .sort(([a, x], [b, y]) => (!x.src - !y.src) || a - b).map(([k], n) => [k, n]));
    const own = list.map((s, k) => {
      const n = s.type === "photo" ? rank.get(k) : seen[s.type]++, set = slots[s.type];
      return scrapHTML(s, st, i, k, place(set[n % set.length], flip, Math.floor(n / set.length) * 34));
    }).join("");
    const kinds = ["ticket", "cal", "receipt"];
    return `<div class="scrap" style="${place(slots.deco, flip)}">${drawn(kinds[i % 3], st, i)}</div>` + own;
  }

  // Edit mode: the scraps laid out flat under the stage, so they're easy to fill in
  function behind(st, i) {
    const items = st.scraps.map((s, k) => `<div class="behind__item">
        ${scrapHTML(s, st, i, k, "")}
        ${s.type === "photo" ? `<input data-sk="${k}" data-sf="src" value="${esc(s.src)}" placeholder="images/journey/photo.jpg">` : ""}
        <button class="behind__rm" type="button" data-tool="rm-scrap" data-sk="${k}" aria-label="Remove">&times;</button>
      </div>`).join("");
    return `<div class="behind" data-i="${i}">
      <h4>Behind this stage</h4>
      <div class="behind__grid">${items}</div>
      <div class="tools__row">
        <button type="button" data-tool="add-news">+ Newspaper</button>
        <button type="button" data-tool="add-photo">+ Photo</button>
      </div>
    </div>`;
  }

  const ytId = (u) => (String(u).match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([\w-]{11})/) || [])[1];
  function media(st) {
    const v = (st.video || "").trim();
    if (!v) return `<div class="ph ph--c" aria-hidden="true">Video</div>`;
    const id = ytId(v);
    if (id) return `<button class="yt" type="button" data-yt="${id}" aria-label="Play video${st.title ? ": " + esc(st.title) : ""}">
        <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" decoding="async"><span class="yt__play" aria-hidden="true">&#9654;</span></button>`;
    return `<video src="${esc(v)}" controls preload="metadata" playsinline></video>`;
  }
  const img = (src, alt) => src ? `<img src="${esc(src)}" alt="${esc(alt || "Journey photo")}" decoding="async">` : `<div class="ph" aria-hidden="true">Photo</div>`;

  function tools(st, i) {
    if (!editing) return "";
    const p = st.photos || [];
    return `<div class="tools" data-i="${i}">
      <label>Type
        <select data-tool="kind">
          <option value="postcard"${st.kind !== "video" ? " selected" : ""}>Photo (smaller moment)</option>
          <option value="video"${st.kind === "video" ? " selected" : ""}>Video (bigger moment)</option>
        </select></label>
      ${st.kind === "video" ? `<label>Video <input data-tool="video" value="${esc(st.video || "")}" placeholder="YouTube link or images/journey/clip.mp4"></label>` : ""}
      <label>Age at this stage <input data-tool="age" value="${esc(st.age || "")}" placeholder="${board.born && ageOf({ year: st.year }) ? "worked out: " + ageOf({ year: st.year }) : "e.g. 8, or set your birth year at the top"}"></label>
      <label>Photo 1 <input data-tool="photo0" value="${esc(p[0] || "")}" placeholder="images/journey/photo.jpg"></label>
      <label>Photo 2 <input data-tool="photo1" value="${esc(p[1] || "")}" placeholder="optional"></label>
      <label>Background: a photo of you at this age, fills the wall <input data-tool="background" value="${esc(st.background || "")}" placeholder="images/journey/board/age-10.jpg"></label>
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
      ${editing ? "" : scraps(st, i)}
      ${main}${small}${marker}
      <div class="note paper" style="${paper(i + 700, "t", 2.2)}">
        ${editing
          ? `<p class="note__label">Stage ${pad(i + 1)}</p>${box("p", "note__year", "year", st.year, "Year")}`
          : `<p class="note__label"><span>Stage ${pad(i + 1)}</span>${st.year ? `<span>${esc(st.year)}</span>` : ""}${ageOf(st) ? `<span>Age ${esc(ageOf(st))}</span>` : ""}</p>`}
        ${box("p", "note__text", "text", st.text, "Write about this stage.")}
      </div>
      ${editing ? behind(st, i) : ""}
      ${tools(st, i)}
    </article>`;
  }

  // The front page: its headline, standfirst and lead story are his to write
  function bField(tag, cls, key, val, ph) {
    if (editing) return `<${tag} class="${cls}" contenteditable="plaintext-only" data-bf="${key}" data-ph="${ph}">${esc(val)}</${tag}>`;
    return val ? `<${tag} class="${cls}">${esc(val)}</${tag}>` : "";
  }
  const masthead = () => {
    const first = stages.find((s) => /\d{4}/.test(s.year || "")), last = [...stages].reverse().find((s) => /\d{4}/.test(s.year || ""));
    const span = first && last ? `${first.year.match(/\d{4}/)[0]}–${last.year.match(/\d{4}/)[0]}` : "New York";
    return `<div class="masthead paper" style="${paper(901, "b", 2.6)}"><span class="pin"></span>
        <small><span>Vol. I</span><span>New York</span><span>${esc(span)}</span></small>
        ${editing ? bField("h1", "masthead__title", "title", board.title, "The Journey") : `<h1 class="masthead__title">${esc(board.title || "The Journey")}</h1>`}
        ${editing ? bField("p", "masthead__deck", "deck", board.deck, "One line under the headline") : `<p class="masthead__deck">${esc(board.deck || "Follow the string. Scroll, or press the button.")}</p>`}
        <div class="masthead__story">
          <p class="masthead__by">By Xander Hudson</p>
          ${editing ? bField("p", "masthead__text", "text", board.text, "What the journey means to you. This is the front-page story.")
            : board.text ? `<p class="masthead__text">${esc(board.text)}</p>` : `<i class="masthead__lines"></i>`}
        </div>
        <p class="masthead__jump">Story continues along the string</p>
      </div>`;
  };
  const intro = () => `<section class="stop" data-stop="intro">
      <div class="scrap" style="${place([44, -18, 50, 6], false)}">${drawn("cal", {}, 0)}</div>
      ${masthead()}
    </section>`;
  const outro = `<section class="stop" data-stop="outro">
      <div class="scrap" style="${place([-14, 52, 50, -7], false)}">${drawn("ticket", {}, 8)}</div>
      <div class="end paper" style="${paper(902, "trbl", 1.4)}"><span class="pin"></span>
        <h2>to be continued&hellip;</h2>
        <a class="btn btn--sig" href="#join" data-join>Get the next chapter first</a>
      </div>
    </section>`;
  const editIntro = () => `<section class="stop" data-stop="intro">
      ${masthead()}
      <div class="tools">
        <h3>Edit your journey</h3>
        <p>The newspaper above is the first thing people see: type your own headline and what the journey means to you. Then type into the dashed boxes on each stage. For pictures, upload them to <b>images/journey/</b> on GitHub (or send them to Claude) and type the path, like <b>images/journey/first-show.jpg</b>. When you're done, press <b>Download journey.js</b>. Your edits stay in this browser until then.</p>
        <label>Birth year: works out your age at each stage for the years down the left <input data-board="born" value="${esc(board.born || "")}" inputmode="numeric" placeholder="e.g. 2008"></label>
        <label>Wall for the start and end, and any stage without its own background <input data-board="background" value="${esc(board.background || "")}" placeholder="images/journey/board/bookshelf.jpg"></label>
      </div>
    </section>`;

  /* ---------- Render ---------- */
  let els = [], bgs = [], boxes = [], frames = [], H = 1, cur = null, target = null, raf = 0;

  function render() {
    if (board.background) {
      boardEl.style.backgroundImage = `url("${encodeURI(board.background)}")`;
      boardEl.classList.add("has-photo");
    } else {
      boardEl.style.backgroundImage = "";
      boardEl.classList.remove("has-photo");
    }
    // one wall photo per stage (stage 1 is the second stop, after the intro)
    bgsEl.innerHTML = editing ? "" : stages.map((s) => s.background
      ? `<div class="bg" style="background-image:url(&quot;${esc(encodeURI(s.background))}&quot;)"></div>` : "<i></i>").join("");
    bgs = [null, ...bgsEl.children].map((el) => (el && el.tagName === "DIV" ? el : null));
    const body = stages.map(stageHTML).join("");
    world.innerHTML = editing ? editIntro() + body : `<svg class="string" aria-hidden="true"></svg>` + intro() + body + outro;
    els = [...world.querySelectorAll(".stop")];
    renderRail();
    if (editing) {
      world.style.setProperty("--u", Math.min(440, cam.clientWidth * 0.84) / 100 + "px");
    } else {
      layout();
      onScroll();
    }
  }

  /* ---------- The years down the left, with his age at each ---------- */
  let railItems = [], railFill = null, railL = 0;
  function renderRail() {
    if (editing || !rail) return;
    const n = stages.length;
    rail.innerHTML = `<i class="rail__line"><b class="rail__fill"></b></i><ol>${stages.map((st, k) => {
      const age = ageOf(st), at = n > 1 ? (k / (n - 1)) * 100 : 0;
      const label = st.year ? `${st.year}${age ? ", age " + age : ""}` : `Stage ${k + 1}`;
      return `<li style="top:${at.toFixed(2)}%"${st.year ? "" : ` class="is-blank"`}>
        <button type="button" data-go="${k + 1}" aria-label="Go to ${esc(label)}">
          <b>${st.year ? esc(st.year) : ""}</b>${age ? `<span>Age ${esc(age)}</span>` : ""}
        </button></li>`;
    }).join("")}</ol>`;
    railItems = [...rail.querySelectorAll("li")];
    railFill = $(".rail__fill", rail);
  }
  function lightRail(idx, p) {
    if (!railFill) return;
    const n = stages.length;
    railFill.style.transform = `scaleY(${n > 1 ? Math.max(0, Math.min(1, (p - 1) / (n - 1))) : 0})`;
    railItems.forEach((li, k) => {
      li.classList.toggle("is-on", k === idx - 1);
      li.classList.toggle("is-past", k < idx - 1);
    });
  }

  /* ---------- Board layout ---------- */
  const availH = () => cam.clientHeight - 84; // room for the controls

  function layout() {
    railL = rail && !editing ? rail.getBoundingClientRect().right : 0; // the stages centre in the room right of the years
    const vw = cam.clientWidth - railL;
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
    return { s, p, tx: railL + (cam.clientWidth - railL) / 2 - s * cx, ty: availH() / 2 - s * cy + 8 };
  }

  function apply(t) {
    world.style.transform = `translate3d(${t.tx}px, ${t.ty}px, 0) scale(${t.s})`;
    boardEl.style.backgroundPosition = `${t.tx * 0.25}px ${t.ty * 0.25}px`;
    // wall photos: the next one fades in over the current one as you move between stages
    const i = Math.floor(t.p), e = ease(t.p - i);
    bgs.forEach((el, k) => {
      if (!el) return;
      let o = 0;
      if (k === i) o = bgs[i + 1] ? 1 : 1 - e;
      else if (k === i + 1) o = e;
      el.style.opacity = o.toFixed(3);
      if (o > 0) el.style.transform = `scale(1.1) translate3d(0, ${((k - t.p) * 3).toFixed(2)}%, 0)`;
    });
  }

  let lastT = 0;
  function tick(now) {
    const dt = Math.min(64, now - (lastT || now)); lastT = now;
    const k = 1 - Math.pow(1 - 0.14, dt / 16.7);
    cur = { s: lerp(cur.s, target.s, k), p: lerp(cur.p, target.p, k), tx: lerp(cur.tx, target.tx, k), ty: lerp(cur.ty, target.ty, k) };
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
    lightRail(idx, p);
    if (lifted) dropLift();
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
    rail && rail.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b) goTo(+b.dataset.go); });
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

  /* ---------- Photo lift: hover a photo (or tap it on a phone) and it comes off the board ---------- */
  const PHOTOS = ".print > img, .polaroid > img";
  const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  let lift = null, lifted = null, liftT = 0;
  function liftEl() {
    if (lift) return lift;
    lift = document.createElement("div");
    lift.className = "lift";
    lift.hidden = true;
    lift.innerHTML = `<figure class="lift__card"><img alt=""><figcaption></figcaption></figure>`;
    document.body.appendChild(lift);
    lift.addEventListener("click", () => dropLift());
    return lift;
  }
  function raiseLift(im, pinned) {
    clearTimeout(liftT);
    if (lifted === im) return;
    const el = liftEl(), card = el.firstElementChild, pic = card.firstElementChild;
    const r = im.getBoundingClientRect();
    const ar = im.naturalWidth && im.naturalHeight ? im.naturalWidth / im.naturalHeight : 0.8;
    const top = cam.getBoundingClientRect().top + 12, bottom = innerHeight - 92, left = (pinned ? 0 : railL) + 12, right = innerWidth - 12;
    const padX = 14, padB = 46; // the white border of the print
    let ih = Math.min((bottom - top) * 0.88, 640) - padX - padB, iw = ih * ar;
    if (iw > (right - left) * 0.9 - padX * 2) { iw = (right - left) * 0.9 - padX * 2; ih = iw / ar; }
    const w = iw + padX * 2, h = ih + padX + padB;
    // pinned (tap): the middle of the room; hover: right over the photo, kept on screen
    const cx = pinned ? (left + right) / 2 : Math.max(left + w / 2, Math.min(right - w / 2, r.left + r.width / 2));
    const cy = pinned ? (top + bottom) / 2 : Math.max(top + h / 2, Math.min(bottom - h / 2, r.top + r.height / 2));
    const st = stages[+(im.closest("[data-i]") || {}).dataset?.i];
    card.lastElementChild.textContent = st ? [st.year, ageOf(st) && "Age " + ageOf(st), st.title].filter(Boolean).join("  ·  ") : "";
    pic.src = im.currentSrc || im.src;
    card.style.cssText = `width:${w}px;left:${cx - w / 2}px;top:${cy - h / 2}px;`;
    const k = r.width / iw;
    const from = `translate(${r.left + r.width / 2 - cx}px, ${r.top + r.height / 2 - cy}px) scale(${k})`;
    el.hidden = false;
    el.classList.toggle("is-pinned", !!pinned);
    el.classList.remove("is-up");
    card.style.transition = "none";
    card.style.transform = from;
    card.dataset.from = from;
    card.offsetWidth; // start from where the photo sits on the board
    card.style.transition = "";
    card.style.transform = "";
    el.classList.add("is-up");
    if (lifted) lifted.classList.remove("is-lifted");
    im.classList.add("is-lifted");
    lifted = im;
  }
  function dropLift() {
    if (!lifted || !lift) return;
    const card = lift.firstElementChild;
    lifted.classList.remove("is-lifted");
    lifted = null;
    lift.classList.remove("is-up");
    card.style.transform = card.dataset.from;
    clearTimeout(liftT);
    liftT = setTimeout(() => { if (!lifted) lift.hidden = true; }, reduced ? 0 : 420);
  }
  if (!editing) {
    world.addEventListener("mouseover", (e) => {
      if (!canHover) return;
      const im = e.target.closest(PHOTOS);
      if (im) { clearTimeout(liftT); liftT = setTimeout(() => raiseLift(im), 90); }
    });
    world.addEventListener("mouseout", (e) => {
      if (!canHover || !e.target.closest(PHOTOS) || (e.relatedTarget && e.relatedTarget.closest?.(PHOTOS) === e.target)) return;
      clearTimeout(liftT);
      liftT = setTimeout(dropLift, 60);
    });
    world.addEventListener("click", (e) => {
      const im = e.target.closest(PHOTOS);
      if (!im || canHover) return;
      if (lifted === im) dropLift(); else raiseLift(im, true);
    });
    addEventListener("keydown", (e) => { if (e.key === "Escape") dropLift(); });
  }

  /* ---------- Edit mode ---------- */
  if (editing) {
    document.body.classList.add("is-editing");
    $(".editbar").hidden = false;
    $(".controls").hidden = true;

    world.addEventListener("input", (e) => {
      const bf = e.target.closest("[contenteditable][data-bf]");
      if (bf) { board[bf.dataset.bf] = bf.innerText.trim(); saveDraft(); return; }
      const sf = e.target.closest("[contenteditable][data-sf]");
      if (sf) {
        stages[+sf.closest(".stop").dataset.i].scraps[+sf.closest("[data-sk]").dataset.sk][sf.dataset.sf] = sf.innerText.trim();
        saveDraft(); return;
      }
      const f = e.target.closest("[data-field]");
      if (!f) return;
      stages[+f.closest(".stop").dataset.i][f.dataset.field] = f.innerText.trim();
      saveDraft();
    });
    world.addEventListener("change", (e) => {
      const bf = e.target.closest("[data-board]");
      if (bf) {
        board[bf.dataset.board] = bf.value.trim();
        saveDraft(); render(); return;
      }
      const src = e.target.closest("input[data-sf]");
      if (src) {
        stages[+src.closest(".stop").dataset.i].scraps[+src.dataset.sk].src = src.value.trim();
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
      if (tool === "age") st.age = t.value.trim();
      if (tool === "background") st.background = t.value.trim();
      saveDraft(); render();
    });
    world.addEventListener("click", (e) => {
      const t = e.target.closest("button[data-tool]");
      if (!t) return;
      const i = +t.closest("[data-i]").dataset.i, sc = stages[i].scraps;
      const tool = t.dataset.tool;
      if (tool === "add-news") sc.push({ type: "news", headline: "", text: "" });
      if (tool === "add-photo") sc.push({ type: "photo", src: "" });
      if (tool === "rm-scrap") sc.splice(+t.dataset.sk, 1);
      if (tool === "up" && i > 0) [stages[i - 1], stages[i]] = [stages[i], stages[i - 1]];
      if (tool === "down" && i < stages.length - 1) [stages[i + 1], stages[i]] = [stages[i], stages[i + 1]];
      if (tool === "delete" && confirm("Delete this stage?")) stages.splice(i, 1);
      saveDraft(); render();
    });

    $(".editbar").addEventListener("click", (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "add") {
        stages.push({ kind: "postcard", year: "", title: "", text: "", note: "", photos: [], video: "", background: "", scraps: blankScraps() });
        saveDraft(); render();
        els[els.length - 1].scrollIntoView({ behavior: "smooth", block: "center" });
      }
      if (act === "download") download();
      if (act === "reset" && confirm("Discard your edits and go back to the published journey?")) {
        try { localStorage.removeItem(DRAFT); } catch {}
        board = clone(window.JOURNEY_BOARD || { background: "", scraps: [] });
        stages = clone(window.JOURNEY || []);
        tidy(); render();
      }
    });
  }

  function download() {
    const cleanBoard = { title: board.title || "", deck: board.deck || "", text: board.text || "", born: board.born || "", background: board.background || "" };
    const clean = stages.map((s) => ({
      kind: s.kind === "video" ? "video" : "postcard",
      year: s.year || "", age: s.age || "", title: s.title || "", text: s.text || "", note: s.note || "",
      photos: (s.photos || []).filter(Boolean), video: s.video || "", background: s.background || "",
      scraps: s.scraps.map(norm)
    }));
    const head = `/* ============================================================
   JOURNEY — a scrapbook board, earliest stage at the top.
   Edit on journey.html?edit, then "Download journey.js".

   JOURNEY_BOARD: the front-page newspaper (title, deck, text),
           your birth year (born) for the ages down the left, and the wall
   kind:   "postcard" for smaller moments, "video" for bigger ones
   year:   shows down the left; age: optional, otherwise worked out from born
   note:   optional red handwritten strip, e.g. a lyric
   photos: up to 2 image paths; video: a YouTube link or .mp4 path
   background: a photo of you at that age; fills the wall and fades into the next
   scraps: newspaper clippings { type: "news", headline, text } and
           photos { type: "photo", src }, layered behind the stage
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

  // older files listed scraps as plain image paths
  function tidy() { stages.forEach((s) => { s.background = s.background || ""; s.scraps = (s.scraps || []).map(norm); }); }
  tidy();
  render();
})();
