/**
 * Optional Cloudflare Worker base that serves /indeed plus /adzuna, /findwork, /jobdata, /careerjet.
 * Keeps secrets off the SPA when deploying `workers/indeed-proxy`.
 */
export function jobApisProxyBase(): string | undefined {
  const b = import.meta.env.VITE_JOB_APIS_PROXY_URL?.trim();
  return b ? b.replace(/\/$/, "") : undefined;
}

/** When proxy base is set, which routed APIs to call (`none` = skip all). Default: all four. */
export function edgeProvidersEnabled(slug: string): boolean {
  const base = jobApisProxyBase();
  if (!base) return false;

  const raw = import.meta.env.VITE_JOB_EDGE_FEATURES?.trim();
  const list =
    raw === undefined || raw === ""
      ? ["adzuna", "findwork", "jobdata", "careerjet"]
      : raw.toLowerCase() === "none"
        ? []
        : raw
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);

  return list.includes(slug.toLowerCase());
}
