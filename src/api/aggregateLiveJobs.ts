import { geoMatchesUnitedStatesFocus } from "../lib/geoFilter";
import { fetchArbeitnowJobs } from "./arbeitnow";
import { fetchIndeedJobs, isIndeedFeedConfigured } from "./indeed";
import { fetchRemoteOkJobs } from "./remoteok";
import { fetchRemotiveJobs } from "./remotive";

const BASE_AGGREGATORS = ["arbeitnow", "remotive", "remote_ok"] as const;

export interface LiveAggregation {
  jobs: import("../types").JobPosting[];
  errors: Partial<Record<string, string>>;
  fetchedAt: string;
  /** Count of upstream fetches this run expects (basis for fallback when every source errors). */
  liveFetcherCount: number;
}

/**
 * Combines Arbeitnow, Remotive, Remote OK, and optionally Indeed (proxied Publisher search)
 * so Pages static hosting can serve real listings without shipping Indeed credentials.
 */
export async function aggregateLiveJobs(
  signal?: AbortSignal,
): Promise<LiveAggregation> {
  const errors: Partial<Record<string, string>> = {};
  const fetchedAt = new Date().toISOString();
  const out: import("../types").JobPosting[] = [];

  let liveFetcherCount = BASE_AGGREGATORS.length;
  const indeedConfigured = isIndeedFeedConfigured();
  if (indeedConfigured) liveFetcherCount += 1;

  const tasks = [
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
    fetchRemoteOkJobs(signal)
      .then((rows) => {
        out.push(...rows);
      })
      .catch((e: unknown) => {
        errors.remote_ok = e instanceof Error ? e.message : "Unknown error";
      }),
    indeedConfigured
      ? fetchIndeedJobs(signal)
          .then((rows) => {
            out.push(...rows);
          })
          .catch((e: unknown) => {
            errors.indeed = e instanceof Error ? e.message : "Unknown error";
          })
      : Promise.resolve(),
  ];

  await Promise.all(tasks);

  out.sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt));

  const usScoped = dedupeJobs(out).filter(geoMatchesUnitedStatesFocus);

  return { jobs: usScoped, errors, fetchedAt, liveFetcherCount };
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
