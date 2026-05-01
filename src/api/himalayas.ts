import { isVisualOnlyDesignFocus } from "../lib/jobFilters";
import { passesBoardIngestUxDesignSignals } from "../lib/liveJobFilter";
import type { JobPosting } from "../types";
import { htmlToPlainText } from "./htmlPlain";

const BASE =
  import.meta.env.VITE_HIMALAYAS_API_BASE?.trim() ?? "https://himalayas.app";

const SEARCH_QUERIES = (
  import.meta.env.VITE_HIMALAYAS_SEARCH_QUERIES?.trim() ??
  "UX designer,product designer,UI UX designer,user experience,interaction designer,design systems"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** Browse slices at offset = n * 20 (max 20 per request per API docs). Default 3 keeps us under rate limits. */
const BROWSE_SLICES = Math.min(
  10,
  Math.max(1, Number(import.meta.env.VITE_HIMALAYAS_BROWSE_SLICES ?? 3)),
);

const MAX_SEARCH_QUERIES_RUN = Math.min(
  8,
  Math.max(1, Number(import.meta.env.VITE_HIMALAYAS_SEARCH_COUNT ?? 5)),
);

type HMResponse = {
  jobs?: HimalayanJob[];
  error?: unknown;
};

type HimalayanRestriction = string | { name?: string; alpha2?: string };

type HimalayanJob = {
  title: string;
  excerpt?: string;
  description?: string;
  companyName: string;
  categories?: string[];
  parentCategories?: string[];
  seniority?: string[];
  employmentType?: string;
  guid: string;
  applicationLink?: string;
  pubDate?: number;
  locationRestrictions?: HimalayanRestriction[];
  timezoneRestrictions?: unknown[];
};

/**
 * Himalayas free JSON API — search + shallow browse pagination for volume.
 * @see https://himalayas.app/docs/remote-jobs-api — attribution appreciated.
 */
export async function fetchHimalayasJobs(signal?: AbortSignal): Promise<JobPosting[]> {
  const tasks: Promise<HimalayanJob[]>[] = [];

  for (const q of SEARCH_QUERIES.slice(0, MAX_SEARCH_QUERIES_RUN)) {
    tasks.push(
      fetchHmJson(new URL(`${BASE.replace(/\/$/, "")}/jobs/api/search`), signal, {
        q,
        limit: "20",
        sort: "recent",
        page: "1",
      }).then((j) => j.jobs ?? []),
    );
  }

  for (let i = 0; i < BROWSE_SLICES; i += 1) {
    tasks.push(
      fetchHmJson(new URL(`${BASE.replace(/\/$/, "")}/jobs/api`), signal, {
        limit: "20",
        offset: String(i * 20),
      }).then((j) => j.jobs ?? []),
    );
  }

  const batches = await Promise.all(tasks);
  const byGuid = new Map<string, HimalayanJob>();
  for (const batch of batches) {
    for (const row of batch) {
      const g = row.guid?.trim();
      if (g && !byGuid.has(g)) byGuid.set(g, row);
    }
  }

  const out: JobPosting[] = [];

  for (const j of byGuid.values()) {
    const title = j.title.trim();
    if (!title || !j.guid?.trim()) continue;

    const plain = htmlToPlainText(j.description ?? j.excerpt ?? "", 16_000);
    const tags = tagList(j);

    if (
      !passesBoardIngestUxDesignSignals(title, plain, tags, {
        boardCategory: [...(j.parentCategories ?? []), ...(j.categories ?? [])].join(", "),
      })
    )
      continue;

    const posting: JobPosting = {
      id: `himalayas-${sanitizeId(j.guid)}`,
      company: j.companyName?.trim() || "Unknown company",
      title,
      postedAt: postedAtIso(j.pubDate),
      snippet: shorten(plain, j.excerpt ?? "", 560),
      applyUrl: (j.applicationLink ?? "").trim() || "https://himalayas.app",
      location: formatLocation(j),
      remote: true,
      tags,
      source: "himalayas",
    };

    if (isVisualOnlyDesignFocus(posting)) continue;

    out.push(posting);
  }

  return out;
}

async function fetchHmJson(
  u: URL,
  signal: AbortSignal | undefined,
  params: Record<string, string>,
): Promise<HMResponse> {
  for (const [k, v] of Object.entries(params)) {
    u.searchParams.set(k, v);
  }
  const res = await fetch(u.toString(), { signal });
  if (!res.ok) {
    throw new Error(`Himalayas error ${res.status}`);
  }
  return (await res.json()) as HMResponse;
}

function sanitizeId(guid: string): string {
  return guid.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 200);
}

function postedAtIso(pubDate?: number): string {
  if (typeof pubDate === "number" && Number.isFinite(pubDate)) {
    const d = new Date(pubDate);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

function shorten(plain: string, excerpt: string, max: number): string {
  const t = plain.trim() || excerpt.trim();
  if (t.length <= max) return t || "See Himalayas for full posting.";
  return t.slice(0, max - 1).trimEnd() + "…";
}

function formatLocation(j: HimalayanJob): string {
  const lr = j.locationRestrictions;
  if (!Array.isArray(lr) || lr.length === 0) return "Remote — worldwide";

  const names = lr
    .map((x) => {
      if (typeof x === "string") return x.trim();
      if (x && typeof x === "object") {
        const name = ("name" in x && typeof x.name === "string" && x.name) || "";
        const a2 =
          "alpha2" in x && typeof x.alpha2 === "string" && x.alpha2 ? ` (${x.alpha2})` : "";
        return `${name}${a2}`.trim();
      }
      return "";
    })
    .filter(Boolean);

  if (!names.length) return "Remote — worldwide";
  return `${names.join("; ")} — remote`;
}

function tagList(j: HimalayanJob): string[] {
  const senior = [...(j.seniority ?? [])].filter(Boolean);
  const cats = [...(j.categories ?? []), ...(j.parentCategories ?? [])]
    .map((x) => x.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const emp = j.employmentType?.trim();

  const out = [...cats, ...senior, ...(emp ? [emp] : []), "himalayas"];

  return [...new Set(out.map((x) => x.trim()).filter(Boolean))];
}
