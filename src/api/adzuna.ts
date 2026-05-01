import { isVisualOnlyDesignFocus } from "../lib/jobFilters";
import { passesBoardIngestUxDesignSignals } from "../lib/liveJobFilter";
import type { JobPosting } from "../types";
import { edgeProvidersEnabled, jobApisProxyBase } from "./jobApisProxy";

const APP_ID = import.meta.env.VITE_ADZUNA_APP_ID?.trim();
const APP_KEY = import.meta.env.VITE_ADZUNA_APP_KEY?.trim();
const COUNTRY = import.meta.env.VITE_ADZUNA_COUNTRY?.trim()?.toLowerCase() || "us";

const SEARCH_TERMS =
  import.meta.env.VITE_ADZUNA_WHAT?.trim() ??
  ["UX designer", "product designer", "user experience"].join("|");

/** Unique terms derived from pipe-delimited env or literals. */
const QUERIES = [...new Set(SEARCH_TERMS.split("|").map((s) => s.trim()).filter(Boolean))].slice(
  0,
  8,
);

const RESULTS_PP = Math.min(
  50,
  Math.max(10, Number(import.meta.env.VITE_ADZUNA_RESULTS_PER_PAGE ?? 35)),
);

type AdzunaCompany = { display_name?: string };
type AdzunaLoc = { display_name?: string };
type Category = { label?: string; tag?: string };
type AdJob = {
  id?: string;
  title?: string;
  description?: string;
  created?: string;
  redirect_url?: string;
  company?: AdzunaCompany;
  location?: AdzunaLoc;
  category?: Category;
};

type AdEnvelope = { results?: AdJob[] };

export function isAdzunaConfigured(): boolean {
  const proxy = jobApisProxyBase();
  const viaEdge = proxy && edgeProvidersEnabled("adzuna");
  return Boolean((APP_ID && APP_KEY) || viaEdge);
}

/**
 * Adzuna aggregates many boards (US default). Prefer Cloudflare Worker with secrets —
 * alternatively set `VITE_ADZUNA_APP_ID` + `VITE_ADZUNA_APP_KEY` (exposed in bundled SPA).
 *
 * @see https://developer.adzuna.com/docs/search
 */
export async function fetchAdzunaJobs(signal?: AbortSignal): Promise<JobPosting[]> {
  if (!isAdzunaConfigured()) return [];

  const base = jobApisProxyBase();
  const useEdge = Boolean(base && edgeProvidersEnabled("adzuna"));

  const payloads = await Promise.all(
    QUERIES.map((what) =>
      useEdge ? fetchViaEdge(base!, what, signal) : fetchDirect(what, signal),
    ),
  );

  const byId = new Map<string, AdJob>();
  for (const envelope of payloads) {
    for (const row of envelope.results ?? []) {
      const rid = row.id?.trim();
      if (rid && !byId.has(rid)) byId.set(rid, row);
    }
  }

  const out: JobPosting[] = [];
  for (const r of byId.values()) {
    const title = r.title?.trim() ?? "";
    if (!title) continue;

    const plain = scrubDescription(r.description ?? "");
    const cat = [r.category?.label, r.category?.tag].filter(Boolean) as string[];
    const tags = [...cat, "adzuna"];

    if (!passesBoardIngestUxDesignSignals(title, plain, tags)) continue;

    const apply = r.redirect_url?.trim();
    if (!apply) continue;

    const posting: JobPosting = {
      id: `adzuna-${String(r.id)}`,
      company: r.company?.display_name?.trim() || "Unknown company",
      title,
      postedAt: isoDate(r.created),
      snippet: shorten(plain, 560),
      applyUrl: apply,
      location: r.location?.display_name?.trim() || "United States",
      remote: /\b(remote|telecommuting|telework|distributed|virtual|usa|national|flexible\b)/i.test(
        `${plain} ${r.location?.display_name ?? ""}`,
      ),
      tags,
      source: "adzuna",
    };

    if (isVisualOnlyDesignFocus(posting)) continue;
    out.push(posting);
  }

  return out;
}

async function fetchViaEdge(origin: string, what: string, signal?: AbortSignal): Promise<AdEnvelope> {
  const u = new URL(`${origin}/adzuna`);
  u.searchParams.set("country", COUNTRY);
  u.searchParams.set("page", "1");
  u.searchParams.set("what", what);
  u.searchParams.set("results_per_page", String(RESULTS_PP));

  const res = await fetch(u.toString(), { signal, headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Adzuna proxy error ${res.status}`);
  return (await res.json()) as AdEnvelope;
}

async function fetchDirect(what: string, signal?: AbortSignal): Promise<AdEnvelope> {
  if (!APP_ID || !APP_KEY) {
    throw new Error("Adzuna direct mode requires VITE_ADZUNA_APP_ID and VITE_ADZUNA_APP_KEY");
  }

  const u = new URL(
    `https://api.adzuna.com/v1/api/jobs/${encodeURIComponent(COUNTRY)}/search/1`,
  );
  u.searchParams.set("app_id", APP_ID);
  u.searchParams.set("app_key", APP_KEY);
  u.searchParams.set("what", what);
  u.searchParams.set("results_per_page", String(RESULTS_PP));
  u.searchParams.set("content-type", "application/json");

  const res = await fetch(u.toString(), { signal, headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Adzuna error ${res.status}`);
  return (await res.json()) as AdEnvelope;
}

function scrubDescription(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shorten(t: string, max: number): string {
  if (t.length <= max) return t || "Open Adzuna listing for details.";
  return t.slice(0, max - 1).trimEnd() + "…";
}

function isoDate(created?: string): string {
  if (!created?.trim()) return new Date().toISOString();
  const d = Date.parse(created);
  return Number.isNaN(d) ? new Date().toISOString() : new Date(d).toISOString();
}
