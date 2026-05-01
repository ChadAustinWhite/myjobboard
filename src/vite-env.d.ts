/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SIMULATE_INCOMING?: string;
  readonly VITE_ARBEITNOW_API_URL?: string;
  readonly VITE_REMOTIVE_API_URL?: string;
  readonly VITE_ARBEITNOW_MAX_PAGES?: string;
  readonly VITE_FEED_REFRESH_MS?: string;
  readonly VITE_FEED_MIN_REFRESH_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
