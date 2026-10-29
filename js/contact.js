/* Industry: the message slip sends to the Google Sheet ("Inquiries" tab), which
   emails it to you. If the Sheet can't take it, the visitor's email app opens instead.
   The fact sheet reads its numbers from content/config.js. */
(function () {
  const S = window.SITE || {};
  const { $, esc, paper, send } = window.XH;
  const API = window.XH.api;
  const to = (S.industryEmail || S.contactEmail || "").trim();

  $(".slip").style.cssText += paper(41, "trbl", 1.1);

  /* ---------- At a glance ---------- */
  const F = S.featured || {}, L = S.links || {};
  const link = (u, t) => `<a href="${esc(u)}" target="_blank" rel="noopener" data-track="${esc(t.toLowerCase())}">${esc(t)}</a>`;
  const rows = [
    ["Based in", "New York, NY"],
    F.followers && ["TikTok followers", esc(F.followers)],
    F.views && F.title && ["Most-played TikTok", `${link(F.video || L.tiktok, F.title)}<br><small>${esc(F.views)} views</small>`],
    L.spotify && ["Spotify", link(L.spotify, "Listen")],
    L.tiktok && ["TikTok", link(L.tiktok, "@" + (L.tiktok.match(/@([^/?]+)/) || [, "profile"])[1])],
    L.instagram && ["Instagram", link(L.instagram, "Follow")],
    L.youtube && ["YouTube", link(L.youtube, "Watch")],
    ["The story so far", `<a href="journey.html">The Journey</a>`]
  ].filter(Boolean);
  $(".glance__list").innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
  const mail = $(".glance__mail");
  if (to) { mail.href = `mailto:${to}`; mail.textContent = to; } else mail.parentElement.remove();

  /* ---------- The slip ---------- */
  const form = $(".slip__form"), msg = $(".form-msg", form), btn = $("button[type=submit]", form);
  const val = (n) => (form.elements[n].value || "").trim();
  const data = () => ({
    about: (form.querySelector("[name=about]:checked") || {}).value || "",
    name: val("name"), company: val("company"), role: val("role"), email: val("email"), phone: val("phone"), message: val("message"), website: val("website")
  });

  // when the Sheet isn't available: the same message, ready to send from their email app
  function byEmail(d) {
    const subject = `Industry inquiry: ${d.about || "General"} from ${d.company || d.name}`;
    const body = [`${d.name}${d.role ? ", " + d.role : ""}${d.company ? ", " + d.company : ""}`, d.email + (d.phone ? " / " + d.phone : ""), "", d.message].join("\n");
    location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function sent(d) {
    form.innerHTML = `<div class="slip__done" tabindex="-1">
      <h3>Message received.</h3>
      <p>Thanks, ${esc(d.name.split(" ")[0])}. It's on Xander's desk, and the reply will come to ${esc(d.email)}.</p>
    </div>`;
    $(".slip__done", form).focus();
  }

  form.addEventListener("input", (e) => e.target.closest(".line, .slip__msg")?.classList.remove("is-bad"));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = data();
    msg.className = "form-msg";
    const bad = [];
    if (!d.name) bad.push("name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) bad.push("email");
    if (d.message.length < 2) bad.push("message");
    bad.forEach((n) => form.elements[n].closest(".line, .slip__msg").classList.add("is-bad"));
    if (bad.length) {
      msg.textContent = `Add your ${bad.map((n) => (n === "email" ? "email address" : n)).join(", ").replace(/, ([^,]*)$/, " and $1")}.`;
      msg.classList.add("err");
      form.elements[bad[0]].focus();
      return;
    }
    if (!API) return byEmail(d);
    btn.disabled = true; msg.textContent = "Sending…";
    send({ type: "inquiry", ...d }).then((res) => {
      if (res.ok) return sent(d); // the Sheet logs it as an event itself
      if (res.error === "fields") { msg.textContent = "Check your name, email and message."; msg.classList.add("err"); return; }
      byEmail(d); // an older Sheet that doesn't know this form yet
    }).catch(() => byEmail(d)).finally(() => { btn.disabled = false; });
  });
})();
