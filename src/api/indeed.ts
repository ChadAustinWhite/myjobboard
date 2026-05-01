import { isVisualOnlyDesignFocus } from "../lib/jobFilters";
import { passesBoardIngestUxDesignSignals } from "../lib/liveJobFilter";
import type { JobPosting } from "../types";

const PROXY = import.meta.env.VITE_INDEED_PROXY_URL?.trim();
const LOCATION = import.meta.env.VITE_INDEED_LOCATION ?? "United States";
const QUERY =
  import.meta.env.VITE_INDEED_SEARCH_Q ??
  '("UX designer" OR "product designer" OR "interaction designer" OR "design systems")';
/** Pages of 25 (Indeed caps `limit`; server proxy passes `limit` capped at 25). */
const MAX_PAGES = Math.min(10, Math.max(1, Number(import.meta.env.VITE_INDEED_MAX_PAGES ?? 3)));

interface IndeedSearchEnvelope {
  /** Indeed returns text errors (“Invalid publisher”) on HTTP 200. */
  error?: string;
  results?: IndeedJobRecord[];
  response?: { results?: IndeedJobRecord[]; error?: string };
}

interface IndeedJobRecord {
  jobkey?: string;
  jobtitle?: string;
  company?: string;
  snippet?: string;
  formattedLocationFull?: string;
  formattedLocation?: string;
  date?: number | string;
  url?: string;
  formattedRelativeTime?: string;
  telecommuting?: boolean | number | string;
}

export function isIndeedFeedConfigured(): boolean {
  return Boolean(PROXY);
}

/**
 * Hydrates postings via your Cloudflare Worker (Publisher search API proxied server-side).
 * Disabled when `VITE_INDEED_PROXY_URL` is unset—secrets never ship with the SPA.
 */
export async function fetchIndeedJobs(signal?: AbortSignal): Promise<JobPosting[]> {
  if (!PROXY) return [];

  const out: JobPosting[] = [];
  const seen = new Set<string>();

  for (let page = 0; page < MAX_PAGES; page += 1) {
    if (signal?.aborted) break;

    const start = page * 25;
    const u = new URL(PROXY);
    u.searchParams.set("q", QUERY);
    if (LOCATION.trim()) u.searchParams.set("l", LOCATION);
    u.searchParams.set("radius", import.meta.env.VITE_INDEED_RADIUS ?? "50");
    u.searchParams.set("sort", "date");
    u.searchParams.set("start", String(start));
    u.searchParams.set("limit", "25");
    u.searchParams.set("fromage", import.meta.env.VITE_INDEED_FROM_AGE ?? "14");
    u.searchParams.set("latlong", "1");
    u.searchParams.set("co", "us");

    const res = await fetch(u.toString(), {
      signal,
      mode: "cors",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Indeed proxy HTTP ${res.status}`);
    }

    const data = (await res.json()) as IndeedSearchEnvelope;
    const apiErr = (data.error ?? data.response?.error ?? "").trim();
    if (apiErr) throw new Error(`Indeed: ${apiErr}`);

    const rows = data.results ?? data.response?.results ?? [];
    if (!rows.length) break;

    for (const r of rows) {
      const key = String(r.jobkey ?? r.url ?? "");
      if (!key || seen.has(key)) continue;

      const title = (r.jobtitle ?? "").trim();
      const plainSnippet = decodeIndeedEntities(stripIndeedHighlight(r.snippet ?? ""));
      const blob = `${title} ${plainSnippet}`.toLowerCase();
      const tags = ["indeed"].concat(extractRoughTags(blob));

      if (!passesBoardIngestUxDesignSignals(title, plainSnippet, tags)) continue;

      const locationLabel =
        r.formattedLocationFull?.trim() || r.formattedLocation?.trim() || LOCATION;
      const remote = inferRemoteIndeed(r.telecommuting, plainSnippet, locationLabel);

      const posting: JobPosting = {
        id: `indeed-${r.jobkey ?? key}`,
        company: r.company?.trim() || "Unknown company",
        title,
        postedAt: parseIndeedDate(r),
        snippet: shorten(plainSnippet, 560),
        applyUrl: r.url ?? `https://www.indeed.com/viewjob?jk=${encodeURIComponent(key)}`,
        location: locationLabel,
        remote,
        tags: [...new Set(tags)],
        source: "indeed",
      };

      if (isVisualOnlyDesignFocus(posting)) continue;

      seen.add(key);
      out.push(posting);
    }

    /** Stop early if Indeed returns less than a full batch (no further pages). */
    if (rows.length < 25) break;
  }

  return out;
}

function inferRemoteIndeed(
  tel: IndeedJobRecord["telecommuting"],
  snippetPlain: string,
  locationLine: string,
): boolean {
  if (tel === true || tel === 1 || tel === "1") return true;
  if (tel === false || tel === 0 || tel === "0") return false;
  if (/remote|work from home|\bwfh\b|\bhybrid\b/i.test(snippetPlain)) return true;
  if (/^\s*remote\s*$/i.test(locationLine.trim())) return true;

  /** Many US-listed roles omit explicit remote semantics—let geo ingest decide. */
  return false;
}

function shorten(plain: string, max: number): string {
  const t = plain.trim();
  if (t.length <= max) return t || "Indeed listing—open posting for complete details.";
  return t.slice(0, max - 1).trimEnd() + "…";
}

function stripIndeedHighlight(snippetHtml: string): string {
  return snippetHtml.replace(/<\/?b>/gi, "");
}

function decodeIndeedEntities(s: string): string {
  let t = s;
  let prev = "";
  while (prev !== t) {
    prev = t;
    t = t
      .replaceAll("&nbsp;", " ")
      .replaceAll("&amp;", "&")
      .replaceAll("&quot;", "\"")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&#39;", "'");
  }

  const doc = stripIndeedHighlight(t.replace(/<[^>]+>/g, " "));
  return doc.replace(/\s+/g, " ").trim();
}

function parseIndeedDate(rec: IndeedJobRecord): string {
  if (typeof rec.date === "number" && Number.isFinite(rec.date)) {
    /** Indeed emits epoch seconds; accept ms payloads defensively (> year ~33658 in ms). */
    const raw = Number(rec.date);
    const ms = raw > 1e12 ? Math.floor(raw) : Math.floor(raw * 1000);

    try {
      return new Date(ms).toISOString();
    } catch {
      /* fallback */
    }
  }

  if (typeof rec.date === "string" && rec.date.trim()) {
    const d = Date.parse(rec.date);
    if (!Number.isNaN(d)) return new Date(d).toISOString();
  }

  const rel = rec.formattedRelativeTime?.trim();
  if (/days? ago|^today$/i.test(rel ?? "") || /\d+(h|hrs?)(\s+ago)?$/i.test(rel ?? "")) {
    return new Date().toISOString();
  }

  return new Date().toISOString();
}

/** Cheap keyword hints for ingest—never replaces body copy semantics. */
function extractRoughTags(blob: string): string[] {
  const tags: string[] = [];
  if (/\bdesign\s+systems?\b/i.test(blob)) tags.push("design systems");
  if (/\bfigma\b/i.test(blob)) tags.push("figma");
  if (/\baccessibility\b|\bwcag\b/i.test(blob)) tags.push("accessibility");
  if (/\buser\s+research\b|\bux research\b|\buxr\b/i.test(blob)) tags.push("user research");
  if (/\bprototype\b|\bwireframe\b/i.test(blob)) tags.push("prototyping");
  return tags;
}
