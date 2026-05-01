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
  /**
   * Same worker origin as Indeed (see `workers/indeed-proxy`) to reach `/adzuna`, `/findwork`,
   * `/jobdata`, `/careerjet` with secrets stored in the Worker.
   */
  readonly VITE_JOB_APIS_PROXY_URL?: string;
  /**
   * Subset of edge routes to call: `adzuna,findwork,jobdata,careerjet`. Use `none` to disable all.
   * When unset, defaults to all four whenever `VITE_JOB_APIS_PROXY_URL` is set.
   */
  readonly VITE_JOB_EDGE_FEATURES?: string;
  readonly VITE_ADZUNA_APP_ID?: string;
  readonly VITE_ADZUNA_APP_KEY?: string;
  readonly VITE_ADZUNA_COUNTRY?: string;
  readonly VITE_ADZUNA_WHAT?: string;
  readonly VITE_ADZUNA_RESULTS_PER_PAGE?: string;
  readonly VITE_FINDWORK_API_TOKEN?: string;
  readonly VITE_FINDWORK_SEARCH?: string;
  readonly VITE_FINDWORK_SEARCH_ROUNDS?: string;
  readonly VITE_FINDWORK_LIMIT?: string;
  readonly VITE_JOBDATA_API_KEY?: string;
  readonly VITE_JOBDATA_TITLES?: string;
  readonly VITE_JOBDATA_PAGE_SIZE?: string;
  readonly VITE_JOBDATA_COUNTRY?: string;
  readonly VITE_JOBDATA_HAS_REMOTE?: string;
  readonly VITE_CAREERJET_KEYWORDS?: string;
  readonly VITE_CAREERJET_LOCALES?: string;
  readonly VITE_CAREERJET_PAGE_SIZE?: string;
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
