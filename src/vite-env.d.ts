/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SIMULATE_INCOMING?: string;
  readonly VITE_ARBEITNOW_API_URL?: string;
  readonly VITE_REMOTIVE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
