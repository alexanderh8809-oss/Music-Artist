/* Postcard + tour-date cards, shared by the home page and the merch page. */
(function () {
  const { esc } = window.XH;
  const S = window.SITE || {};
  const phClass = ["", "ph--b", "ph--c"];

  function buyHref(item) {
    if (item.buy) return item.buy;
    const subject = `Order: ${item.title} postcard ($${item.price})`;
    return `mailto:${S.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent("Shipping name and address:\n\n")}`;
  }

  window.XH.postcard = function (item, i = 0) {
    const front = item.image
      ? `<img src="${esc(item.image)}" alt="${esc(item.title)} postcard" loading="lazy">`
      : `<div class="ph ${phClass[i % 3]}" aria-hidden="true"><span class="pc__ph-title">${esc(item.title)}</span></div>`;
    const where = [item.place, item.date].filter(Boolean).map(esc).join(" · ");
    return `
      <article class="pc${item.featured ? " pc--featured" : ""}">
        <div class="pc__front">
          <span class="tape tape--plain pc__tape" aria-hidden="true"></span>
          ${front}
          <span class="pc__stamp" aria-hidden="true">${esc(item.number)}</span>
        </div>
        <div class="pc__meta">
          <div>
            <h3 class="pc__title">${esc(item.title)}</h3>
            ${where ? `<p class="pc__where">${where}</p>` : ""}
            ${item.scrap ? `<p class="scrap pc__scrap">${esc(item.scrap)}</p>` : ""}
          </div>
          <div class="pc__buy">
            <span class="pc__price">$${Number(item.price).toFixed(0)}</span>
            <a class="btn btn--sig btn--sm" href="${esc(buyHref(item))}" data-track="buy_${esc(item.id)}"${item.buy ? ' target="_blank" rel="noopener"' : ""}>Buy</a>
          </div>
        </div>
      </article>`;
  };

  const fmt = (d) => {
    const dt = new Date(d + "T12:00:00");
    if (isNaN(dt)) return { m: "", day: esc(d) };
    return { m: dt.toLocaleString("en-US", { month: "short" }), day: dt.getDate(), y: dt.getFullYear() };
  };
  window.XH.dateCard = function (show) {
    const f = fmt(show.date);
    return `
      <article class="show">
        <div class="show__date"><span>${esc(f.m)}</span><strong>${esc(f.day)}</strong><span>${esc(f.y || "")}</span></div>
        <div class="show__info">
          <h3>${esc(show.city)}</h3>
          <p>${esc(show.venue || "")}</p>
          ${show.tickets ? `<a class="btn btn--sig btn--sm" href="${esc(show.tickets)}" target="_blank" rel="noopener" data-track="tickets">Tickets</a>` : `<span class="label">Tickets soon</span>`}
        </div>
      </article>`;
  };
})();
