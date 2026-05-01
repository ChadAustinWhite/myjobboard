import { isVisualOnlyDesignFocus } from "../lib/jobFilters";
import { passesBoardIngestUxDesignSignals } from "../lib/liveJobFilter";
import type { JobPosting } from "../types";

const DEFAULT_FEED =
  import.meta.env.VITE_CAREERNEST_FEED_URL?.trim() ?? "https://careernest.cloud/api/feed";

const PAGES = Math.min(
  8,
  Math.max(1, Number(import.meta.env.VITE_CAREERNEST_PAGES ?? 3)),
);

interface CareerNestEnvelope {
  success?: boolean;
  jobs?: CareerNestJob[];
  total?: number;
}

interface CareerNestJob {
  id: number | string;
  title?: string;
  company?: string;
  description?: string;
  location?: string;
  posted_at?: string;
  expires_at?: string;
  category?: string;
  job_type?: string;
  job_url?: string;
  apply_url?: string;
}

/**
 * Career Nest free JSON feed — paginated slices (30 req/min per IP docs).
 * @see https://careernest.cloud/api-docs
 */
export async function fetchCareerNestJobs(signal?: AbortSignal): Promise<JobPosting[]> {
  const byId = new Map<string, CareerNestJob>();

  for (let page = 1; page <= PAGES; page += 1) {
    if (signal?.aborted) break;
    const u = new URL(DEFAULT_FEED);
    u.searchParams.set("page", String(page));
    u.searchParams.set("limit", "50");

    const res = await fetch(u.toString(), { signal });
    if (!res.ok) throw new Error(`CareerNest error ${res.status}`);

    const body = (await res.json()) as CareerNestEnvelope;
    if (body.success === false) continue;

    const rows = body.jobs ?? [];
    if (!rows.length) break;

    for (const r of rows) {
      const sid = String(r.id);
      if (!byId.has(sid)) byId.set(sid, r);
    }
  }

  const out: JobPosting[] = [];

  for (const r of byId.values()) {
    const title = r.title?.trim() ?? "";
    if (!title) continue;

    const plain =
      decodeBasicEntities((r.description ?? "").replace(/\r\n/g, "\n")).replace(/\s+/g, " ");

    const cat = r.category?.trim();
    const jt = r.job_type?.trim();
    const tags: string[] = [...new Set([cat, jt].filter((x): x is string => Boolean(x)))];

    if (!passesBoardIngestUxDesignSignals(title, plain, tags)) continue;

    const apply = (r.apply_url ?? r.job_url ?? "").trim();
    if (!apply) continue;

    const posting: JobPosting = {
      id: `careernest-${String(r.id)}`,
      company: r.company?.trim() || "Unknown company",
      title,
      postedAt: normalizeIso(r.posted_at),
      snippet: shorten(plain, 560),
      applyUrl: apply,
      location: r.location?.trim() || "Location TBD",
      remote:
        /\b(remote|worldwide|anywhere|distributed|wfh|work\s+from\s+home)\b/i.test(
          `${r.location ?? ""}\n${plain}`,
        ) || !/\b(?:on[- ]site|office|vor\s+ort|hybrid\b)/i.test(title),
      tags: [...tags, "careernest"],
      source: "careernest",
    };

    if (isVisualOnlyDesignFocus(posting)) continue;

    out.push(posting);
  }

  return out;
}

function decodeBasicEntities(s: string): string {
  let t = s.replaceAll("&nbsp;", " ");
  while (/&amp;/i.test(t)) {
    t = t.replace(/&amp;/gi, "&");
  }
  return t
    .replaceAll("&quot;", "\"")
    .replace(/&#(?:0)*39;/gi, "'")
    .replace(/&#[xX](?:27|0027);/g, "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .trim();
}

function shorten(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t || "Listing on Career Nest — open for details.";
  return t.slice(0, max - 1).trimEnd() + "…";
}

function normalizeIso(raw?: string): string {
  if (!raw?.trim()) return new Date().toISOString();
  const d = Date.parse(raw);
  return Number.isNaN(d) ? new Date().toISOString() : new Date(d).toISOString();
}
