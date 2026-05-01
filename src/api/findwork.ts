import { isVisualOnlyDesignFocus } from "../lib/jobFilters";
import { passesBoardIngestUxDesignSignals } from "../lib/liveJobFilter";
import type { JobPosting } from "../types";
import { htmlToPlainText } from "./htmlPlain";
import { edgeProvidersEnabled, jobApisProxyBase } from "./jobApisProxy";

const TOKEN = import.meta.env.VITE_FINDWORK_API_TOKEN?.trim();

const SEARCH_ROUNDS = Math.min(
  6,
  Math.max(1, Number(import.meta.env.VITE_FINDWORK_SEARCH_ROUNDS ?? 3)),
);

const SKILLS_DEFAULT = (
  import.meta.env.VITE_FINDWORK_SEARCH?.trim() ?? "UX design|product design|UI design"
)
  .split("|")
  .map((s) => s.trim())
  .filter(Boolean);

type FwRow = {
  role?: string;
  company_name?: string;
  location?: string;
  remote?: boolean;
  url?: string;
  text?: string;
  employment_type?: string | null;
  date?: string;
  created?: string;
};

type FwEnvelope = { count?: number; results?: FwRow[] };

export function isFindworkConfigured(): boolean {
  const base = jobApisProxyBase();
  return Boolean(TOKEN || (base && edgeProvidersEnabled("findwork")));
}

/**
 * Findwork.tech developer-job index. Auth header: `Token <api_key>` (often blocked by CORS in browser —
 * use `VITE_JOB_APIS_PROXY_URL` + Worker `/findwork` route instead).
 *
 * @see https://findwork.dev/
 */
export async function fetchFindworkJobs(signal?: AbortSignal): Promise<JobPosting[]> {
  if (!isFindworkConfigured()) return [];

  const terms = [...new Set(SKILLS_DEFAULT)].slice(0, SEARCH_ROUNDS);
  const payloads = await Promise.all(terms.map((search) => fetchOneFindwork(search, signal)));

  const byUrl = new Map<string, FwRow>();
  for (const envelope of payloads) {
    const rows = extractRows(envelope);
    for (const row of rows) {
      const u = row.url?.trim();
      if (u && !byUrl.has(u)) byUrl.set(u, row);
    }
  }

  const out: JobPosting[] = [];
  for (const row of byUrl.values()) {
    const title = row.role?.trim() ?? "";
    if (!title) continue;

    const plain = htmlToPlainText(row.text ?? "", 16_000);
    const emp = row.employment_type ?? "";
    const tags = [...new Set([emp, "developer", "findwork"].filter(Boolean))] as string[];

    if (!passesBoardIngestUxDesignSignals(title, plain, tags)) continue;

    const apply = row.url?.trim();
    if (!apply) continue;

    const posting: JobPosting = {
      id: fwId(apply, title),
      company: row.company_name?.trim() || "Unknown company",
      title,
      postedAt: isoDate(row.date ?? row.created),
      snippet: shorten(plain, row.text ?? "", 520),
      applyUrl: apply,
      location: row.location?.trim() || (row.remote ? "Remote" : "Location TBD"),
      remote: Boolean(row.remote),
      tags,
      source: "findwork",
    };

    if (isVisualOnlyDesignFocus(posting)) continue;
    out.push(posting);
  }

  return out;
}

async function fetchOneFindwork(search: string, signal?: AbortSignal): Promise<FwEnvelope> {
  let u: URL;
  if (TOKEN) {
    u = new URL("https://findwork.dev/api/jobs/");
  } else {
    const origin = jobApisProxyBase();
    if (!origin) throw new Error("Findwork proxy base missing");
    u = new URL(`${origin}/findwork`);
  }
  u.searchParams.set("search", search);
  u.searchParams.set("remote", "true");
  u.searchParams.set("limit", String(Math.min(30, Number(import.meta.env.VITE_FINDWORK_LIMIT ?? 25))));

  const hdrs: HeadersInit = { accept: "application/json" };
  if (TOKEN) hdrs.Authorization = `Token ${TOKEN}`;

  const res = await fetch(u.toString(), { signal, headers: hdrs });
  if (!res.ok) throw new Error(`Findwork error ${res.status}`);
  return (await res.json()) as FwEnvelope;
}

function extractRows(env: FwEnvelope): FwRow[] {
  if (Array.isArray(env)) return env as FwRow[];
  if (env?.results && Array.isArray(env.results)) return env.results;
  return [];
}

function fwId(url: string, title: string): string {
  const h = simpleHash(url + title);
  return `findwork-${h}`;
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function shorten(plain: string, htmlish: string, max: number): string {
  const t = plain.trim() || htmlish.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t || "Findwork listing — open for full text.";
  return t.slice(0, max - 1).trimEnd() + "…";
}

function isoDate(raw?: string): string {
  if (!raw?.trim()) return new Date().toISOString();
  const d = Date.parse(raw);
  return Number.isNaN(d) ? new Date().toISOString() : new Date(d).toISOString();
}
