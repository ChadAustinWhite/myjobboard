import { isVisualOnlyDesignFocus } from "../lib/jobFilters";
import { passesBoardIngestUxDesignSignals } from "../lib/liveJobFilter";
import type { JobPosting } from "../types";
import { htmlToPlainText } from "./htmlPlain";

/** Public JSON feed with permissive CORS; terms require linking back via their listing URLs. */
const DEFAULT_URL = import.meta.env.VITE_REMOTEOK_API_URL ?? "https://remoteok.com/api";

type RemoteOkJobRow = {
  id: string;
  company: string;
  position: string;
  date?: string;
  tags?: string[];
  description?: string;
  location?: string;
  apply_url?: string;
};

export async function fetchRemoteOkJobs(signal?: AbortSignal): Promise<JobPosting[]> {
  const res = await fetch(DEFAULT_URL, { signal });
  if (!res.ok) {
    throw new Error(`Remote OK error ${res.status}`);
  }

  const payload = (await res.json()) as unknown[];
  if (!Array.isArray(payload) || payload.length < 2) {
    return [];
  }

  /** Index 0 is legal / metadata — job rows follow. */
  const rows = payload.slice(1) as RemoteOkJobRow[];
  const out: JobPosting[] = [];

  for (const row of rows) {
    const title = row.position?.trim() ?? "";
    if (!title) continue;

    const plain = htmlToPlainText(row.description ?? "", 16_000);
    const tags = normalizeTags(row.tags);

    if (!passesBoardIngestUxDesignSignals(title, plain, tags)) continue;

    const posting: JobPosting = {
      id: `remoteok-${row.id}`,
      company: row.company?.trim() || "Unknown company",
      title,
      postedAt: normalizeIso(row.date),
      snippet: shorten(plain, 560),
      applyUrl: row.apply_url?.trim() || `https://remoteok.com/remote-jobs/${row.id}`,
      location: row.location?.trim() || "Remote",
      /** Remote OK only lists location-flexible roles; geo filter still drops EU-only locks. */
      remote: true,
      tags,
      source: "remote_ok",
    };

    if (isVisualOnlyDesignFocus(posting)) continue;

    out.push(posting);
  }

  return out;
}

function normalizeTags(raw?: string[]): string[] {
  if (!raw?.length) return [];
  return [...new Set(raw.map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean))];
}

function shorten(plain: string, max: number): string {
  const t = plain.trim();
  if (t.length <= max) return t || "Open listing for full details.";
  return t.slice(0, max - 1).trimEnd() + "…";
}

function normalizeIso(isoMaybe?: string): string {
  if (!isoMaybe) return new Date().toISOString();
  const d = Date.parse(isoMaybe);
  if (!Number.isNaN(d)) return new Date(d).toISOString();
  return new Date().toISOString();
}
