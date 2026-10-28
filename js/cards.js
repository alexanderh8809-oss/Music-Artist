/* Postcards and tour tickets, shared by the home page and the merch page. */
(function () {
  const { esc, paper } = window.XH;
  const S = window.SITE || {};
  const phClass = ["", "ph--b", "ph--c"];

  function buyHref(item) {
    if (item.buy) return item.buy;
    const subject = `Order: ${item.title} postcard ($${item.price})`;
    return `mailto:${S.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent("Shipping name and address:\n\n")}`;
  }

  // A postcard: the photo on the front, a handwritten back with the price.
  // Tap anywhere on it to flip; the Buy link on the back stays clickable.
  window.XH.postcard = function (item, i = 0) {
    const front = item.image
      ? `<img src="${esc(item.image)}" alt="" decoding="async">`
      : `<div class="ph ${phClass[i % 3]}" aria-hidden="true"></div>`;
    const where = [item.place, item.date].filter(Boolean).map(esc).join(", ");
    const note = item.scrap || where || `${item.title}, from the first songs.`;
    return `
      <article class="pcard" data-id="${esc(item.id)}">
        <div class="pcard__in">
          <div class="pcard__face pcard__front paper" style="${paper(i * 11 + 3, "", 0)}">
            ${front}
            <h3 class="pcard__title">${esc(item.title)}</h3>
            <span class="pcard__num" aria-hidden="true">${esc(item.number)}</span>
          </div>
          <div class="pcard__face pcard__back paper" style="${paper(i * 11 + 4, "", 0)}">
            <p class="pcard__note">${esc(note)}</p>
            <div class="pcard__to">
              <span class="pcard__stamp" aria-hidden="true">NYC<br>${esc(item.number)}</span>
              <span class="pcard__price">$${Number(item.price).toFixed(0)}</span>
              <a class="btn btn--hit btn--sm pcard__buy" href="${esc(buyHref(item))}" data-track="buy_${esc(item.id)}"${item.buy ? ' target="_blank" rel="noopener"' : ""}>Buy</a>
            </div>
            <span class="pcard__postmark" aria-hidden="true">NEW YORK<br>N.Y.</span>
          </div>
        </div>
        <button class="pcard__flip" type="button" aria-pressed="false" aria-label="Flip the ${esc(item.title)} postcard to see the back and price"></button>
      </article>`;
  };

  const fmt = (d) => {
    const dt = new Date(d + "T12:00:00");
    if (isNaN(dt)) return { m: "", day: esc(d) };
    return { m: dt.toLocaleString("en-US", { month: "short" }), day: dt.getDate(), y: dt.getFullYear() };
  };
  // A show: a printed ticket
  window.XH.dateCard = function (show, i = 0) {
    const f = fmt(show.date);
    return `
      <article class="ticket-stub paper" style="${paper(i * 13 + 40, "lr", 1.2)}">
        <div class="ticket-stub__date"><span>${esc(f.m)}</span><strong>${esc(f.day)}</strong><span>${esc(f.y || "")}</span></div>
        <div>
          <h3>${esc(show.city)}</h3>
          <p>${esc(show.venue || "")}</p>
          ${show.tickets ? `<a class="btn btn--hit btn--sm" href="${esc(show.tickets)}" target="_blank" rel="noopener" data-track="tickets">Tickets</a>` : `<span class="label">Tickets soon</span>`}
        </div>
      </article>`;
  };
})();
