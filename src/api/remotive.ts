import { isVisualOnlyDesignFocus } from "../lib/jobFilters";
import { passesBoardIngestUxDesignSignals } from "../lib/liveJobFilter";
import type { JobPosting } from "../types";
import { htmlToPlainText } from "./htmlPlain";

const DEFAULT_URL =
  import.meta.env.VITE_REMOTIVE_API_URL ?? "https://remotive.com/api/remote-jobs";

type RemotiveResponse = {
  jobs?: RawRemotive[];
};

interface RawRemotive {
  id: number;
  url: string;
  title: string;
  company_name: string;
  category: string;
  tags?: string[];
  publication_date: string;
  candidate_required_location?: string;
  description?: string;
}

/** Smaller subset from Remotive (public tier); still useful as a supplemental board. */
export async function fetchRemotiveJobs(signal?: AbortSignal): Promise<JobPosting[]> {
  const res = await fetch(DEFAULT_URL, { signal });

  if (!res.ok) {
    throw new Error(`Remotive error ${res.status}`);
  }

  const data = (await res.json()) as RemotiveResponse;
  const rows = data.jobs ?? [];

  const out: JobPosting[] = [];

  for (const j of rows) {
    const title = j.title.trim();
    const plain = htmlToPlainText(j.description ?? "", 16_000);
    const tags = tagList(j);

    if (
      !passesBoardIngestUxDesignSignals(title, plain, tags, {
        boardCategory: j.category,
      })
    )
      continue;

    const posting: JobPosting = {
      id: `remotive-${j.id}`,
      company: j.company_name,
      title,
      postedAt: normalizeIso(j.publication_date),
      snippet: excerptPlain(plain, j.tags ?? []),
      applyUrl: j.url,
      location: locationLabel(j.candidate_required_location),
      remote: true,
      tags,
      source: "remotive",
    };

    if (isVisualOnlyDesignFocus(posting)) continue;

    out.push(posting);
  }

  return out;
}

function tagList(j: RawRemotive): string[] {
  const out = [...(j.tags ?? [])];
  const cat = j.category?.trim();
  if (cat) out.unshift(cat.replace(/\s+/g, " "));
  return [...new Set(out)];
}

function excerptPlain(plain: string, tags: string[]): string {
  const t = plain.trim();
  if (t.length > 520) return t.slice(0, 517).trimEnd() + "…";
  if (!t && tags.length) {
    return `Tags: ${tags.join(", ")}`;
  }

  return t || "Listing from Remotive (open their page for full details).";
}

function locationLabel(raw?: string): string {
  const s = raw?.trim();
  return s && s.length > 1 ? s : "Remote";
}

function normalizeIso(isoMaybe: string): string {
  const d = Date.parse(isoMaybe);
  if (!Number.isNaN(d)) return new Date(d).toISOString();
  return new Date().toISOString();
}
