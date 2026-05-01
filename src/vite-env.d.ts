/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SIMULATE_INCOMING?: string;
  readonly VITE_ARBEITNOW_API_URL?: string;
  readonly VITE_REMOTIVE_API_URL?: string;
  readonly VITE_ARBEITNOW_MAX_PAGES?: string;
  readonly VITE_FEED_REFRESH_MS?: string;
  readonly VITE_FEED_MIN_REFRESH_MS?: string;
  /** Himalayas browse depth (offsets 0 … (n−1)×20 jobs). Default 3. */
  readonly VITE_HIMALAYAS_BROWSE_SLICES?: string;
  /** Comma-separated search phrases (design/UX-focused). Max runs clamped via VITE_HIMALAYAS_SEARCH_COUNT. */
  readonly VITE_HIMALAYAS_SEARCH_QUERIES?: string;
  /** How many Himalayas search phrases to fire per sync (default 5). */
  readonly VITE_HIMALAYAS_SEARCH_COUNT?: string;
  readonly VITE_HIMALAYAS_API_BASE?: string;
  /** Career Nest feed pagination (50 jobs/page). Default 3 pages. */
  readonly VITE_CAREERNEST_PAGES?: string;
  readonly VITE_CAREERNEST_FEED_URL?: string;
  /** Base URL for Cloudflare Worker that proxies Publisher search (omit to disable Indeed). */
  readonly VITE_INDEED_PROXY_URL?: string;
  readonly VITE_INDEED_SEARCH_Q?: string;
  readonly VITE_INDEED_LOCATION?: string;
  readonly VITE_INDEED_MAX_PAGES?: string;
  readonly VITE_INDEED_RADIUS?: string;
  readonly VITE_INDEED_FROM_AGE?: string;
  readonly VITE_JOBICY_API_URL?: string;
  readonly VITE_JOBICY_COUNT?: string;
  readonly VITE_JOBICY_GEO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
