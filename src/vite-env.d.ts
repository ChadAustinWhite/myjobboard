/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SIMULATE_INCOMING?: string;
  readonly VITE_ARBEITNOW_API_URL?: string;
  readonly VITE_REMOTIVE_API_URL?: string;
  readonly VITE_ARBEITNOW_MAX_PAGES?: string;
  readonly VITE_FEED_REFRESH_MS?: string;
  readonly VITE_FEED_MIN_REFRESH_MS?: string;
  /** Base URL for Cloudflare Worker that proxies Publisher search (omit to disable Indeed). */
  readonly VITE_INDEED_PROXY_URL?: string;
  readonly VITE_INDEED_SEARCH_Q?: string;
  readonly VITE_INDEED_LOCATION?: string;
  readonly VITE_INDEED_MAX_PAGES?: string;
  readonly VITE_INDEED_RADIUS?: string;
  readonly VITE_INDEED_FROM_AGE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
