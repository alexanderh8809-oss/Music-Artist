/* Founding Fans: the pass (count + sign-up) and the register of numbered lines.
   The names come from the Google Sheet (backend/Code.gs, "Subscribers" tab).
   Only numbers and the names fans chose are public; emails never leave the Sheet. */
(function () {
  const { $, esc, paper, pad, wireForm, welcome, send } = window.XH;
  const API = window.XH.api;
  const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { return null; } };

  $(".pass").style.cssText += paper(11, "lrb", 1.2);
  $(".register").style.cssText += paper(23, "tr", 1.6);

  const count = $(".pass__count"), lines = $(".register__lines");
  const join = $(".pass__join"), msg = $(".form-msg", join);
  const mine = () => Number(store("xh_fan")) || 0;

  /* ---------- The sign-up on the pass ---------- */
  wireForm(join, "fans", () => store("xh_sign_done", "1"));
  if (store("xh_joined") === "1") {
    // already joined in this browser: show their number instead of the form
    $("form", join).hidden = true;
    const fan = mine(), key = store("xh_fan_key");
    if (fan && fan <= 1000 && key && !store("xh_sign_done")) welcome(msg, { fan, founding: true, already: true, key }, () => store("xh_sign_done", "1"));
    else if (fan && fan <= 1000) msg.innerHTML = `<b>You're Founding Fan No.&nbsp;${pad(fan)}.</b> Early access, for life.`;
    else msg.textContent = "You're on the list.";
  }

  /* ---------- The register ---------- */
  function draw(w) {
    if (!w || !w.ok) {
      // the Sheet isn't sharing the register yet: show the empty page, honestly
      count.innerHTML = `<b>1,000</b> spots`;
      lines.innerHTML = Array.from({ length: 12 }, (_, i) => `<li><span class="n">${pad(i + 1)}</span><span class="who"></span></li>`).join("");
      lines.insertAdjacentHTML("afterend", `<p class="register__more">The register fills in as fans join.</p>`);
      return;
    }
    const limit = w.limit || 1000, taken = Math.min(w.taken || 0, limit);
    const names = {}; (w.names || []).forEach((x) => (names[x.n] = x.name));
    count.innerHTML = taken >= limit
      ? `All <b>${limit.toLocaleString()}</b> taken`
      : `<b>${(limit - taken).toLocaleString()}</b> of ${limit.toLocaleString()} left`;
    const me = mine(), shown = Math.min(limit, Math.max(taken + 6, 14));
    let html = "";
    for (let n = 1; n <= shown; n++) {
      const cls = n === me ? ' class="is-me"' : "";
      let who = "";
      if (names[n]) who = `<span class="who">${esc(names[n])}</span>`;
      else if (n <= taken) who = `<span class="who who--plain">Founding fan</span>`;
      else if (n === taken + 1) who = `<span class="who who--open">your name here</span>`;
      else who = `<span class="who"></span>`;
      html += `<li${cls}><span class="n">${pad(n)}</span>${who}</li>`;
    }
    lines.innerHTML = html;
    const old = $(".register__more"); if (old) old.remove();
    if (taken >= limit) lines.insertAdjacentHTML("afterend", `<p class="register__more">The register is full. Join the list anyway for everything else.</p>`);
  }

  function load() {
    if (!API) return draw(null);
    fetch(`${API}?wall=1&t=${Date.now()}`).then((r) => r.json()).then(draw).catch(() => draw(null));
  }
  load();
  // a new signature shows up as soon as it's written
  addEventListener("xh:joined", () => setTimeout(load, 400));
  addEventListener("xh:signed", load);
})();
