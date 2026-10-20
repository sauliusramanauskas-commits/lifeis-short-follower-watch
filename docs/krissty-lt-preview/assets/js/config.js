/* ==========================================================================
   KRISSTY.LT – CONFIG  (edit this block only)
   --------------------------------------------------------------------------
   Contact details (confirmed 2026-10-20).
   - email:  where booking requests go (mailto).
   - phone:  tel: number in international format, "" = hidden.
   - phoneDisplay: how the number is shown on the page.
   - messengerUrl: leave "" to open the Facebook profile instead.
             (e.g. "https://m.me/<page-or-username>" once confirmed)
   ========================================================================== */
window.KRISSTY_CONFIG = {
  email: 'contact@krissty.lt',
  phone: '+37060430526',
  phoneDisplay: '+370 604 30526',
  facebookUrl: 'https://www.facebook.com/people/Lifeis-Short/100013159621667/',
  messengerUrl: '',                  // PLACEHOLDER – empty = use facebookUrl
  giveawayUrl: 'https://sauliusramanauskas-commits.github.io/krissty/',
  defaultLang: 'lt',

  /* Video reel under the hero – section is HIDDEN while url is ''.
     url: YouTube (watch / youtu.be / shorts), Vimeo, Facebook video/reel URL,
          or a local file e.g. 'assets/video/reel.mp4' (H.264 MP4, ideally < 15 MB).
     poster: optional local preview image (e.g. 'assets/video/reel-poster.jpg').
             Nothing is loaded from YouTube/Vimeo/Facebook until the visitor clicks play.
     vertical: true for 9:16 Reels/Shorts/TikTok-style video. */
  reel: {
    url: '',
    poster: '',
    vertical: false,
    title: { lt: 'Mano darbų santrauka', en: 'My showreel' }
  }
};
