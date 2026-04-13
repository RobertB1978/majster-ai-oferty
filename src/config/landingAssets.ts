// =============================================================================
// Landing Page Asset Source-of-Truth
// =============================================================================
// This is the single configuration file for all marketing assets used on the
// landing page. Update this file — not individual section components — when
// real assets become available.
//
// SWAP-IN GUIDE (per asset type):
//   Video     → set video.youtubeVideoId to the actual YouTube ID
//   Poster    → set video.posterPath to '/assets/video-poster.jpg'
//   Screenshot→ set screenshots.<key>.path to '/assets/screenshots/<file>.png'
//   Testimonial→ set socialProof.isPlaceholder = false, verified: true per item
//   Logo      → push entries to clientLogos[] once logo usage is approved
//   OG image  → set ogImage.path to '/og-image.png', update width/height, isReady: true
// =============================================================================

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScreenshotAsset {
  /**
   * Path relative to /public for the real screenshot image.
   * null = use the existing inline SVG mockup in ProductScreenshotsSection.
   * Example: '/assets/screenshots/dashboard.png'
   */
  path: string | null;
  /** Accessible alt text for when a real image is present. */
  alt: string;
}

interface VideoAsset {
  /**
   * YouTube video ID — the part after youtube.com/watch?v=
   * null = show "Coming Soon" state in VideoSection.
   * Example: 'dQw4w9WgXcQ'
   */
  youtubeVideoId: string | null;
  /**
   * Path relative to /public for a custom video poster image.
   * Shown as thumbnail before the user clicks play.
   * null = use the existing dark gradient poster in VideoSection.
   * Example: '/assets/video-poster.jpg'
   */
  posterPath: string | null;
  /** Human-readable duration label shown in the video badge. */
  durationLabel: string;
}

interface TestimonialItem {
  /**
   * i18n key suffix. Corresponding translation keys:
   *   landing.socialProof.<key>.quote
   *   landing.socialProof.<key>.name
   *   landing.socialProof.<key>.role
   */
  key: string;
  /** Two-letter initials shown in the avatar circle when photoPath is null. */
  initials: string;
  /** Tailwind class string for the avatar background/text colour. */
  avatarClass: string;
  /**
   * Path relative to /public for a real headshot photo.
   * null = show initials avatar.
   * Example: '/assets/testimonials/jan-kowalski.jpg'
   */
  photoPath: string | null;
  /**
   * true = real, verified user who consented to being featured.
   * false = placeholder preview data (NOT a real person's testimonial).
   * Never set isPlaceholder = false while any item has verified = false.
   */
  verified: boolean;
}

interface SocialProofAssets {
  /**
   * true = the section uses internal placeholder data, NOT real user testimonials.
   * Flip to false only when every item in `items` has verified: true AND
   * the section copy has been reviewed by the project owner.
   */
  isPlaceholder: boolean;
  items: TestimonialItem[];
}

interface ClientLogo {
  /** Display name of the company (used for aria-label). */
  name: string;
  /** Path relative to /public for the logo file. */
  logoPath: string;
  /** Optional link to the company's website. */
  url?: string;
}

interface OgImageAsset {
  /** Path relative to /public. */
  path: string;
  width: number;
  height: number;
  /**
   * true = a dedicated 1200×630 social card image is in place.
   * false = currently using a fallback icon (not ideal for social sharing).
   */
  isReady: boolean;
}

export interface LandingAssetsConfig {
  video: VideoAsset;
  screenshots: {
    dashboard: ScreenshotAsset;
    offerEditor: ScreenshotAsset;
    pdfPreview: ScreenshotAsset;
  };
  socialProof: SocialProofAssets;
  /**
   * Real client or partner logos.
   * Leave this array EMPTY until every company has explicitly approved
   * their logo being used on Majster.AI marketing materials.
   * Never add placeholder / fake logos here.
   */
  clientLogos: ClientLogo[];
  ogImage: OgImageAsset;
}

// ─── Configuration ────────────────────────────────────────────────────────────

export const LANDING_ASSETS: LandingAssetsConfig = {
  // ── Video demo ─────────────────────────────────────────────────────────────
  video: {
    youtubeVideoId: null,   // TODO: replace with actual ID once demo is recorded
    posterPath: null,       // TODO: '/assets/video-poster.jpg' (1920×1080, JPG)
    durationLabel: '~3 min',
  },

  // ── Product screenshots ────────────────────────────────────────────────────
  // All three slots are null — ProductScreenshotsSection shows inline SVG
  // mockups as premium placeholders. Swap any slot to a real image path to
  // immediately upgrade that tab without changing component logic.
  screenshots: {
    dashboard: {
      path: null,
      alt: 'Majster.AI — pulpit główny z przeglądem projektów i finansów',
    },
    offerEditor: {
      path: null,
      alt: 'Majster.AI — edytor oferty z asystentem AI',
    },
    pdfPreview: {
      path: null,
      alt: 'Majster.AI — podgląd wyceny PDF gotowej do wysłania klientowi',
    },
  },

  // ── Social proof ───────────────────────────────────────────────────────────
  // isPlaceholder: true means this data is for internal preview only.
  // The section is truthfully framed in copy — no deceptive claims.
  socialProof: {
    isPlaceholder: true,
    items: [
      {
        key: 't1',
        initials: 'MK',
        avatarClass:
          'bg-amber-100 dark:bg-accent-amber/20 text-amber-800 dark:text-accent-amber',
        photoPath: null,
        verified: false,
      },
      {
        key: 't2',
        initials: 'DS',
        avatarClass:
          'bg-gray-100 dark:bg-brand-surface text-gray-700 dark:text-neutral-300',
        photoPath: null,
        verified: false,
      },
      {
        key: 't3',
        initials: 'TW',
        avatarClass:
          'bg-amber-50 dark:bg-accent-amber/10 text-amber-700 dark:text-accent-amber-light',
        photoPath: null,
        verified: false,
      },
    ],
  },

  // ── Client logos ───────────────────────────────────────────────────────────
  // Empty by design. Do not add logos here without written approval from
  // the respective company.
  clientLogos: [],

  // ── Open Graph image ───────────────────────────────────────────────────────
  // Currently using the app icon as a fallback.
  // Replace with a proper 1200×630 social card image:
  //   path: '/og-image.png', width: 1200, height: 630, isReady: true
  ogImage: {
    path: '/icon-512.png',
    width: 512,
    height: 512,
    isReady: false,
  },
};
