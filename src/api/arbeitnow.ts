import { isVisualOnlyDesignFocus } from "../lib/jobFilters";
import { passesUxProductDesignFocus } from "../lib/liveJobFilter";
import type { JobPosting } from "../types";
import { htmlToPlainText } from "./htmlPlain";

const DEFAULT_URL =
  import.meta.env.VITE_ARBEITNOW_API_URL ??
  "https://www.arbeitnow.com/api/job-board-api";

const MAX_PAGES = Math.min(
  5,
  Math.max(1, Number(import.meta.env.VITE_ARBEITNOW_MAX_PAGES ?? 1)),
);

interface RawArbeitnow {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  job_types: string[];
  location: string;
  created_at: string;
}

export async function fetchArbeitnowJobs(signal?: AbortSignal): Promise<JobPosting[]> {
  const out: JobPosting[] = [];
  const slugSeen = new Set<string>();
  let page = 1;

  while (page <= MAX_PAGES) {
    if (signal?.aborted) break;

    const pageUrl = new URL(DEFAULT_URL);
    pageUrl.searchParams.set("page", String(page));

    const res = await fetch(pageUrl.toString(), { signal });
    if (!res.ok) {
      throw new Error(`Arbeitnow error ${res.status}`);
    }

    const body = (await res.json()) as { data?: RawArbeitnow[] };
    const rows = body.data ?? [];
    if (!rows.length) break;

    for (const r of rows) {
      if (slugSeen.has(r.slug)) continue;
      slugSeen.add(r.slug);
      const title = r.title?.trim() ?? "";
      const plain = htmlToPlainText(r.description ?? "", 16_000);
      const tags = normalizeTags(r.tags, r.job_types);

      if (!passesUxProductDesignFocus(title, plain, tags)) continue;

      const draft: JobPosting = {
        id: `arbeitnow-${r.slug}`,
        company: r.company_name?.trim() || "Unknown company",
        title,
        postedAt: normalizeIso(r.created_at),
        snippet: shorten(plain, 560),
        applyUrl: r.url,
        location:
          r.location?.trim() || (r.remote ? "Remote — location TBD" : "On-site — location TBD"),
        remote: Boolean(r.remote),
        tags,
        source: "arbeitnow",
      };

      if (isVisualOnlyDesignFocus(draft)) continue;

      out.push(draft);
    }

    page += 1;
  }

  return out;
}

function normalizeTags(tags: string[], jobTypes: string[]): string[] {
  const out = [
    ...tags.map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean),
    ...jobTypes.map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean),
  ];
  return [...new Set(out)];
}

function shorten(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

function normalizeIso(isoMaybe: string): string {
  const d = Date.parse(isoMaybe);
  if (!Number.isNaN(d)) return new Date(d).toISOString();
  return new Date().toISOString();
}
