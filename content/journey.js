/* ============================================================
   JOURNEY — a scrapbook board, earliest stage at the top.

   EASIEST WAY TO EDIT: open journey.html?edit on your site,
   type into the boxes, press "Download journey.js", and tell
   Claude "I downloaded it" (or upload it here on GitHub).

   BOARD
   background: the wall for the start and end, and for any stage
               without its own background. Empty = a drawn bookshelf.

   EACH STAGE
   kind:       "postcard" for smaller moments, "video" for bigger ones
   year:       written on the stage's note
   title:      handwritten under the main photo
   text:       the story, on the lined note
   note:       optional red handwritten strip, e.g. a lyric
   photos:     up to 2 image paths, e.g. ["images/journey/first-guitar.jpg"]
   video:      a YouTube link, or a path like "images/journey/show.mp4"
   background: a photo of you at that age. It fills the whole wall
               behind the stage and fades into the next one as you scroll.
   scraps:     paper layered behind the stage, as many as you like:
               { type: "news", headline: "...", text: "..." }  a newspaper clipping
               { type: "photo", src: "images/journey/..." }    a loose photo print
   ============================================================ */
window.JOURNEY_BOARD = {
  background: ""
};

window.JOURNEY = [
  {
    kind: "postcard", year: "", title: "", text: "", note: "", photos: [], video: "", background: "",
    scraps: [
      { type: "news", headline: "", text: "" },
      { type: "photo", src: "" },
      { type: "news", headline: "", text: "" },
      { type: "photo", src: "" }
    ]
  },
  {
    kind: "postcard", year: "", title: "", text: "", note: "", photos: [], video: "", background: "",
    scraps: [
      { type: "news", headline: "", text: "" },
      { type: "photo", src: "" },
      { type: "news", headline: "", text: "" },
      { type: "photo", src: "" }
    ]
  },
  {
    kind: "video", year: "", title: "", text: "", note: "", photos: [], video: "", background: "",
    scraps: [
      { type: "news", headline: "", text: "" },
      { type: "photo", src: "" },
      { type: "news", headline: "", text: "" },
      { type: "photo", src: "" }
    ]
  },
  {
    kind: "postcard", year: "", title: "", text: "", note: "", photos: [], video: "", background: "",
    scraps: [
      { type: "news", headline: "", text: "" },
      { type: "photo", src: "" },
      { type: "news", headline: "", text: "" },
      { type: "photo", src: "" }
    ]
  },
  {
    kind: "video", year: "", title: "", text: "", note: "", photos: [], video: "", background: "",
    scraps: [
      { type: "news", headline: "", text: "" },
      { type: "photo", src: "" },
      { type: "news", headline: "", text: "" },
      { type: "photo", src: "" }
    ]
  }
];
