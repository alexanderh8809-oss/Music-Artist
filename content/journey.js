/* ============================================================
   JOURNEY — a scrapbook board, earliest stage at the top.

   EASIEST WAY TO EDIT: open journey.html?edit on your site,
   type into the boxes, press "Download journey.js", and tell
   Claude "I downloaded it" (or upload it here on GitHub).

   BOARD (applies to the whole page)
   background: the wall behind everything, e.g. a bookshelf photo
   scraps:     paper bits layered behind the photos — newspaper,
               tickets, receipts, calendar pages. PNGs with
               transparent edges look best. They're reused in turn.
   Leave them empty and the page draws its own paper scraps.

   EACH STAGE
   kind:   "postcard" for smaller moments, "video" for bigger ones
   year:   written on the stage's note
   title:  handwritten under the main photo
   text:   the story, on the lined note
   note:   optional red handwritten strip, e.g. a lyric
   photos: up to 2 image paths, e.g. ["images/journey/first-guitar.jpg"]
   video:  a YouTube link, or a path like "images/journey/show.mp4"
   scraps: optional, overrides the board scraps for this stage only
   ============================================================ */
window.JOURNEY_BOARD = {
  background: "",
  scraps: []
};

window.JOURNEY = [
  { kind: "postcard", year: "", title: "", text: "", note: "", photos: [], video: "", scraps: [] },
  { kind: "postcard", year: "", title: "", text: "", note: "", photos: [], video: "", scraps: [] },
  { kind: "video",    year: "", title: "", text: "", note: "", photos: [], video: "", scraps: [] },
  { kind: "postcard", year: "", title: "", text: "", note: "", photos: [], video: "", scraps: [] },
  { kind: "video",    year: "", title: "", text: "", note: "", photos: [], video: "", scraps: [] }
];
