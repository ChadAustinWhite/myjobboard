import { isVisualOnlyDesignFocus } from "../lib/jobFilters";
import { passesBoardIngestUxDesignSignals } from "../lib/liveJobFilter";
import type { JobPosting } from "../types";
import { htmlToPlainText } from "./htmlPlain";

/**
 * Remote jobs JSON with permissive CORS. Terms ask for attribution and linking to Jobicy-hosted pages.
 * @see https://jobicy.com → API docs
 */
const DEFAULT_URL =
  import.meta.env.VITE_JOBICY_API_URL ?? "https://jobicy.com/api/v2/remote-jobs";

const COUNT = Math.min(
  100,
  Math.max(1, Number(import.meta.env.VITE_JOBICY_COUNT ?? 100)),
);

interface JobicyResponse {
  jobs?: JobicyJobRow[];
  success?: boolean;
  error?: string;
}

interface JobicyJobRow {
  id: number;
  url?: string;
  jobTitle?: string;
  companyName?: string;
  jobDescription?: string;
  jobExcerpt?: string;
  jobIndustry?: string[];
  jobType?: string[];
  jobLevel?: string;
  jobGeo?: string;
  pubDate?: string;
}

export async function fetchJobicyJobs(signal?: AbortSignal): Promise<JobPosting[]> {
  const u = new URL(DEFAULT_URL);
  u.searchParams.set("count", String(COUNT));
  /** Narrow to US-aligned rows the board already trusts for geo — still run full geo ingest after merge. */
  u.searchParams.set("geo", (import.meta.env.VITE_JOBICY_GEO ?? "usa").trim() || "usa");

  const res = await fetch(u.toString(), { signal });
  if (!res.ok) throw new Error(`Jobicy error ${res.status}`);

  const envelope = (await res.json()) as JobicyResponse;
  if (envelope.success === false) {
    throw new Error(envelope.error?.trim() || "Jobicy API rejected request");
  }
  const rows = envelope.jobs ?? [];
  const out: JobPosting[] = [];

  for (const row of rows) {
    const title = decodeBasicEntities(row.jobTitle?.trim() ?? "");
    if (!title) continue;

    const plain = htmlToPlainText(row.jobDescription ?? row.jobExcerpt ?? "", 16_000);
    const industries = row.jobIndustry?.map((x) => decodeBasicEntities(x)) ?? [];
    const types = row.jobType?.map((x) => decodeBasicEntities(x)) ?? [];
    const level = row.jobLevel ? decodeBasicEntities(row.jobLevel) : "";
    const tags = [...new Set([...industries, ...types, ...(level ? [level] : []), "jobicy"])].filter(
      Boolean,
    );

    if (!passesBoardIngestUxDesignSignals(title, plain, tags)) continue;

    const geoLabel = decodeBasicEntities(row.jobGeo?.trim() || "Remote");
    const posting: JobPosting = {
      id: `jobicy-${row.id}`,
      company: decodeBasicEntities(row.companyName?.trim() || "Unknown company"),
      title,
      postedAt: normalizeIso(row.pubDate),
      snippet: shorten(plain, 560),
      applyUrl: row.url?.trim() ?? `https://jobicy.com/jobs/${row.id}`,
      location: geoLabel,
      remote: true,
      tags,
      source: "jobicy",
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
  t = t
    .replaceAll("&quot;", "\"")
    .replace(/&#(?:0)*39;/gi, "'")
    .replace(/&#[xX](?:27|0027);/g, "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/\s+/g, " ");

  return t.trim();
}

function shorten(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t || "Listing from Jobicy (open employer page for detail).";
  return t.slice(0, max - 1).trimEnd() + "…";
}

function normalizeIso(raw?: string): string {
  if (!raw?.trim()) return new Date().toISOString();
  const d = Date.parse(raw);
  return Number.isNaN(d) ? new Date().toISOString() : new Date(d).toISOString();
}
