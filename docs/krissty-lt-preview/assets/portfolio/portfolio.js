/* ==========================================================================
   PORTFOLIO LIST
   --------------------------------------------------------------------------
   1. Drop optimized images into assets/portfolio/ (≈1200px long side,
      JPG ~80% quality or WebP, ideally < 250 KB each).
   2. Add one entry per image below. Order = display order.

   Fields:
     src       – image path (required for real work)
     webp      – optional WebP version of the same image
     full      – optional larger image shown in the lightbox
     cat       – "photo" | "event" | "video" | "social"   (used by filters)
     alt       – { lt, en } description for screen readers / SEO
     caption   – optional { lt, en } short caption on the tile
     wide      – optional true = tile spans 2 columns
     href      – optional link instead of lightbox (e.g. a Reel / YouTube URL)
     placeholder – true = "coming soon" tile (no image). DELETE these once
                   you have real work for that category.
   ========================================================================== */
window.KRISSTY_PORTFOLIO = [
  {
    src: 'assets/portfolio/krissty-portretas.jpg',
    webp: 'assets/portfolio/krissty-portretas.webp',
    full: 'assets/img/krissty-hero-1024.jpg',   // optional bigger image for the lightbox
    cat: 'photo',
    alt: { lt: 'Portretas – Kristina (Krissty) su žaliais plaukais', en: 'Portrait – Kristina (Krissty) with green hair' },
    caption: { lt: 'Portretas', en: 'Portrait' }
  },
  /* --- PLACEHOLDERS (not real projects) – remove when real work is added --- */
  { placeholder: true, cat: 'event',  wide: true, label: { lt: 'Vestuvės', en: 'Weddings' } },
  { placeholder: true, cat: 'photo',  label: { lt: 'Porų fotosesija', en: 'Couple session' } },
  { placeholder: true, cat: 'social', label: { lt: 'Reels / TikTok', en: 'Reels / TikTok' } },
  { placeholder: true, cat: 'photo',  label: { lt: 'Mustang fotosesija', en: 'Mustang shoot' } },
  { placeholder: true, cat: 'video',  wide: true, label: { lt: 'Renginio vaizdo klipas', en: 'Event highlight film' } }
];
