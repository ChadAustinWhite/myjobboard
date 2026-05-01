import { isVisualOnlyDesignFocus } from "../lib/jobFilters";
import { passesBoardIngestUxDesignSignals } from "../lib/liveJobFilter";
import type { JobPosting } from "../types";
import { edgeProvidersEnabled, jobApisProxyBase } from "./jobApisProxy";

const KEYWORDS = (
  import.meta.env.VITE_CAREERJET_KEYWORDS?.trim() ??
  "UX designer|product designer|user experience designer"
)
  .split("|")
  .map((s) => s.trim())
  .filter(Boolean)
  .slice(0, 5);

/** Careerjet requires Referer + Basic Auth + IP; only supported via Worker route `/careerjet`. */
export function isCareerjetConfigured(): boolean {
  const px = jobApisProxyBase();
  return Boolean(px && edgeProvidersEnabled("careerjet"));
}

type CJRow = {
  title?: string;
  company?: string;
  date?: string;
  description?: string;
  locations?: string;
  url?: string;
};

type CJEnvelope = { jobs?: CJRow[]; type?: string; message?: string };

/**
 * Careerjet partner JSON search (Basic auth + required Referer/end-user hints). Call through
 * `{VITE_JOB_APIS_PROXY_URL}/careerjet` where the Worker holds `CAREERJET_*` secrets.
 *
 * @see https://www.careerjet.com/partners/api/
 */
export async function fetchCareerjetJobs(signal?: AbortSignal): Promise<JobPosting[]> {
  if (!isCareerjetConfigured()) return [];

  const origin = jobApisProxyBase()!;
  const locales = (
    import.meta.env.VITE_CAREERJET_LOCALES?.trim() ?? "en_US"
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2);

  const rounds: Promise<CJEnvelope>[] = [];
  for (const lc of locales) {
    for (const kw of KEYWORDS) {
      const u = new URL(`${origin}/careerjet`);
      u.searchParams.set("locale_code", lc);
      u.searchParams.set("keywords", kw);
      u.searchParams.set("sort", "date");
      u.searchParams.set("page", "1");
      u.searchParams.set("page_size", String(Math.min(100, Number(import.meta.env.VITE_CAREERJET_PAGE_SIZE ?? 40))));
      rounds.push(
        fetch(u.toString(), { signal, headers: { accept: "application/json" } }).then(async (res) => {
          if (!res.ok) throw new Error(`Careerjet proxy error ${res.status}`);
          return (await res.json()) as CJEnvelope;
        }),
      );
    }
  }

  const payloads = await Promise.all(rounds);
  const byUrl = new Map<string, CJRow>();
  for (const env of payloads) {
    for (const row of env.jobs ?? []) {
      const href = row.url?.trim();
      if (href && !byUrl.has(href)) byUrl.set(href, row);
    }
  }

  const out: JobPosting[] = [];
  for (const r of byUrl.values()) {
    const title = r.title?.trim() ?? "";
    if (!title) continue;

    const plain = (r.description ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const tags = ["careerjet"];

    if (!passesBoardIngestUxDesignSignals(title, plain, tags)) continue;

    const apply = r.url?.trim();
    if (!apply) continue;

    const posting: JobPosting = {
      id: cjId(apply),
      company: r.company?.trim() || "Unknown company",
      title,
      postedAt: isoDate(r.date),
      snippet: shorten(plain, 520),
      applyUrl: apply,
      location: r.locations?.trim() || "United States",
      remote: /\b(remote|distributed|usa|north america)\b/i.test(`${plain}\n${r.locations ?? ""}`),
      tags,
      source: "careerjet",
    };

    if (isVisualOnlyDesignFocus(posting)) continue;
    out.push(posting);
  }

  return out;
}

function cjId(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i += 1) h = (h * 33 + url.charCodeAt(i)) >>> 0;
  return `careerjet-${h.toString(36)}`;
}

function shorten(t: string, max: number): string {
  if (t.length <= max) return t || "Careerjet listing.";
  return t.slice(0, max - 1).trimEnd() + "…";
}

function isoDate(raw?: string): string {
  if (!raw?.trim()) return new Date().toISOString();
  const d = Date.parse(raw);
  return Number.isNaN(d) ? new Date().toISOString() : new Date(d).toISOString();
}
