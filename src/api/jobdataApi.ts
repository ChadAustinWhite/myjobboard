import { isVisualOnlyDesignFocus } from "../lib/jobFilters";
import { passesBoardIngestUxDesignSignals } from "../lib/liveJobFilter";
import type { JobPosting } from "../types";
import { edgeProvidersEnabled, jobApisProxyBase } from "./jobApisProxy";
import { htmlToPlainText } from "./htmlPlain";

const DIRECT_KEY = import.meta.env.VITE_JOBDATA_API_KEY?.trim();

const TITLE_QUERIES = (
  import.meta.env.VITE_JOBDATA_TITLES?.trim() ?? "UX designer|product designer|interaction designer"
)
  .split("|")
  .map((s) => s.trim())
  .filter(Boolean)
  .slice(0, 4);

const PAGE_SIZE = Math.min(
  100,
  Math.max(15, Number(import.meta.env.VITE_JOBDATA_PAGE_SIZE ?? 40)),
);

type JdCompany = { name?: string };
type TypeRow = { name?: string };
type JdRow = {
  id?: number | string;
  title?: string;
  location?: string;
  description?: string;
  published?: string;
  application_url?: string;
  has_remote?: boolean;
  company?: JdCompany;
  types?: TypeRow[];
};

type JdEnvelope = { results?: JdRow[] };

export function isJobdataConfigured(): boolean {
  const base = jobApisProxyBase();
  return Boolean(DIRECT_KEY || (base && edgeProvidersEnabled("jobdata")));
}

/**
 * JobData API (`jobdataapi.com`) — documented as server-side/CORS-sensitive; proxy recommended.
 *
 * @see https://jobdataapi.com/docs/
 */
export async function fetchJobdataJobs(signal?: AbortSignal): Promise<JobPosting[]> {
  if (!isJobdataConfigured()) return [];

  const base = jobApisProxyBase();
  const useEdge = Boolean(base && edgeProvidersEnabled("jobdata"));

  const byId = new Map<string, JdRow>();

  for (const title of TITLE_QUERIES) {
    if (signal?.aborted) break;
    const env = await fetchJobdataPage(title, useEdge, base ?? "", signal);
    for (const row of env.results ?? []) {
      const sid = String(row.id ?? "");
      if (sid && !byId.has(sid)) byId.set(sid, row);
    }
  }

  const out: JobPosting[] = [];
  for (const r of byId.values()) {
    const title = r.title?.trim() ?? "";
    if (!title) continue;

    const plain = htmlToPlainText(r.description ?? "", 16_000);
    const typeNames = (r.types ?? []).map((t) => t.name?.trim()).filter(Boolean) as string[];
    const tags = [...typeNames, "jobdataapi"];

    if (!passesBoardIngestUxDesignSignals(title, plain, tags)) continue;

    const apply = r.application_url?.trim();
    if (!apply) continue;

    const posting: JobPosting = {
      id: `jobdata-${String(r.id)}`,
      company: r.company?.name?.trim() || "Unknown company",
      title,
      postedAt: iso(r.published),
      snippet: shorten(plain, 560),
      applyUrl: apply,
      location: r.location?.trim() || "Location TBD",
      remote: Boolean(r.has_remote),
      tags,
      source: "jobdataapi",
    };

    if (isVisualOnlyDesignFocus(posting)) continue;
    out.push(posting);
  }

  return out;
}

async function fetchJobdataPage(
  title: string,
  useEdge: boolean,
  proxyOrigin: string,
  signal?: AbortSignal,
): Promise<JdEnvelope> {
  const u = useEdge
    ? new URL(`${proxyOrigin}/jobdata`)
    : new URL("https://jobdataapi.com/api/jobs/");
  u.searchParams.set("title", title);
  u.searchParams.set("page", "1");
  u.searchParams.set("page_size", String(PAGE_SIZE));
  u.searchParams.set("country_code", import.meta.env.VITE_JOBDATA_COUNTRY?.trim()?.toUpperCase() || "US");
  u.searchParams.set("has_remote", import.meta.env.VITE_JOBDATA_HAS_REMOTE?.trim() || "true");
  u.searchParams.set("language", "en");

  const hdrs: HeadersInit = {
    accept: "application/json",
  };
  if (!useEdge) {
    if (!DIRECT_KEY) throw new Error("jobdata direct mode requires VITE_JOBDATA_API_KEY");
    hdrs.Authorization = `Api-Key ${DIRECT_KEY}`;
  }

  const res = await fetch(u.toString(), { signal, headers: hdrs });
  if (!res.ok) throw new Error(`jobdata error ${res.status}`);
  return (await res.json()) as JdEnvelope;
}

function shorten(t: string, max: number): string {
  const s = t.trim();
  if (s.length <= max) return s || "JobData listing — see apply link.";
  return s.slice(0, max - 1).trimEnd() + "…";
}

function iso(raw?: string): string {
  if (!raw?.trim()) return new Date().toISOString();
  const d = Date.parse(raw);
  return Number.isNaN(d) ? new Date().toISOString() : new Date(d).toISOString();
}
