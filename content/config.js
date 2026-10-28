/* ============================================================
   SITE SETTINGS — edit the values between the quotes.
   You can edit this file right on GitHub (pencil icon).
   ============================================================ */
window.SITE = {
  // Music-only contact email (shown in the footer)
  contactEmail: "music@xanderhudson.com",

  // Link-in-bio links. Leave "" to hide a button.
  // Spotify: your artist page, e.g. "https://open.spotify.com/artist/..."
  // Instagram: e.g. "https://www.instagram.com/yourname"
  links: {
    spotify: "",
    tiktok: "https://www.tiktok.com/@alexander.hudson46",
    instagram: "",
    youtube: ""
  },

  // The TikTok shown on the home page. Update the numbers whenever you like.
  featured: {
    video: "https://www.tiktok.com/@alexander.hudson46/video/7652202639958052126",
    poster: "images/tiktok-delilah.jpg",
    title: "Hey There Delilah",
    caption: "song sounds like leaving home after graduation",
    views: "6.5M",
    likes: "1.2M",
    shares: "125.7K",
    followers: "36K"
  },

  // Google Sheet backend: the "Web app URL" from backend/SETUP.md, step 4.
  // It saves mailing-list emails and visitor analytics to your Google Sheet.
  // While this is "", the Join form opens an email to contactEmail instead.
  backend: "https://script.google.com/macros/s/AKfycbyRYkmyZnllihP7yMUeeLqJTTLR9mB-8S04JWCNj84dXffoLFDKFqSPXdCCKwA3pmDYJw/exec"
};
