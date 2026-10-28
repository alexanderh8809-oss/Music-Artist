/* ============================================================
   MERCH — postcards for now.
   Each postcard ships with an image, a place and a date.

   price:   number in US dollars
   image:   path to a photo in images/merch/ (leave "" for a placeholder)
   place / date: what's written on the card
   buy:     a checkout link (Stripe Payment Link, Shopify, Big Cartel…).
            Leave "" and the button opens an order email instead.
   regions: which continents it ships to (see content/tour.js ids),
            or ["all"].
   ============================================================ */
window.MERCH = [
  { id: "elevator-girl",      title: "Elevator Girl",      number: "01", price: 5,  place: "", date: "", image: "", buy: "", regions: ["all"] },
  { id: "macbook",            title: "Macbook",            number: "02", price: 5,  place: "", date: "", image: "", buy: "", regions: ["all"] },
  { id: "more-than-my-love",  title: "More Than My Love",  number: "03", price: 5,  place: "", date: "", image: "", buy: "", regions: ["all"] },
  { id: "second-place",       title: "Second Place",       number: "04", price: 5,  place: "", date: "", image: "", buy: "", regions: ["all"] },
  { id: "with-you",           title: "With You",           number: "05", price: 5,  place: "", date: "", image: "", buy: "", regions: ["all"] },
  { id: "if-only-i-was-you",  title: "If Only I Was You",  number: "06", price: 5,  place: "", date: "", image: "", buy: "", regions: ["all"] },
  { id: "leave",              title: "Leave",              number: "07", price: 5,  place: "", date: "", image: "", buy: "", regions: ["all"], scrap: "no receipts required" },
  { id: "postcard-set",       title: "The First Postcards (set of 7)", number: "01–07", price: 28, place: "", date: "", image: "", buy: "", regions: ["all"], featured: true }
];
