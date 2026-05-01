import { fetchRemotiveJobs } from "./remotive";
import { fetchArbeitnowJobs } from "./arbeitnow";

export interface LiveAggregation {
  jobs: import("../types").JobPosting[];
  errors: Partial<Record<string, string>>;
  fetchedAt: string;
}

/**
 * Combines Arbeitnow board data with Remotive’s public slice so the feed spans
 * more than either board alone without inventing postings.
 */
export async function aggregateLiveJobs(
  signal?: AbortSignal,
): Promise<LiveAggregation> {
  const errors: Partial<Record<string, string>> = {};
  const fetchedAt = new Date().toISOString();
  const out: import("../types").JobPosting[] = [];

  await Promise.all([
    fetchArbeitnowJobs(signal)
      .then((rows) => {
        out.push(...rows);
      })
      .catch((e: unknown) => {
        errors.arbeitnow = e instanceof Error ? e.message : "Unknown error";
      }),
    fetchRemotiveJobs(signal)
      .then((rows) => {
        out.push(...rows);
      })
      .catch((e: unknown) => {
        errors.remotive = e instanceof Error ? e.message : "Unknown error";
      }),
  ]);

  out.sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt));

  return { jobs: dedupeJobs(out), errors, fetchedAt };
}

function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 /+|-]/gi, "")
    .trim();
}

function dedupeJobs(jobs: import("../types").JobPosting[]): import("../types").JobPosting[] {
  const seen = new Set<string>();
  const merged: typeof jobs = [];

  for (const j of jobs) {
    const urlKey = normalizeKey(j.applyUrl.replace(/^https?:\/\//i, ""));
    const companyTitle = normalizeKey(`${j.company} ${j.title}`);
    const keys = [`u:${urlKey}`, `ct:${companyTitle}`];
    if (seen.has(keys[0]) || seen.has(keys[1])) continue;
    seen.add(keys[0]);
    seen.add(keys[1]);
    merged.push(j);
  }

  return merged;
}
