import { geoMatchesUnitedStatesFocus } from "../lib/geoFilter";
import { fetchAdzunaJobs, isAdzunaConfigured } from "./adzuna";
import { fetchArbeitnowJobs } from "./arbeitnow";
import { fetchCareerNestJobs } from "./careernest";
import { fetchCareerjetJobs, isCareerjetConfigured } from "./careerjet";
import { fetchFindworkJobs, isFindworkConfigured } from "./findwork";
import { fetchHimalayasJobs } from "./himalayas";
import { fetchIndeedJobs, isIndeedFeedConfigured } from "./indeed";
import { fetchJobdataJobs, isJobdataConfigured } from "./jobdataApi";
import { fetchJobicyJobs } from "./jobicy";
import { fetchRemoteOkJobs } from "./remoteok";
import { fetchRemotiveJobs } from "./remotive";

const BASE_AGGREGATORS = [
  "arbeitnow",
  "remotive",
  "remote_ok",
  "jobicy",
  "himalayas",
  "careernest",
] as const;

export interface LiveAggregation {
  jobs: import("../types").JobPosting[];
  errors: Partial<Record<string, string>>;
  fetchedAt: string;
  /** Count of upstream fetches this run expects (basis for fallback when every source errors). */
  liveFetcherCount: number;
}

/**
 * Combines public JSON boards + optional Indeed (proxy) + optional Adzuna / Findwork / jobdata / Careerjet
 * so the client keeps a fuller UX slice without extra infrastructure.
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
  if (isAdzunaConfigured()) liveFetcherCount += 1;
  if (isFindworkConfigured()) liveFetcherCount += 1;
  if (isJobdataConfigured()) liveFetcherCount += 1;
  if (isCareerjetConfigured()) liveFetcherCount += 1;

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
    fetchJobicyJobs(signal)
      .then((rows) => {
        out.push(...rows);
      })
      .catch((e: unknown) => {
        errors.jobicy = e instanceof Error ? e.message : "Unknown error";
      }),
    fetchHimalayasJobs(signal)
      .then((rows) => {
        out.push(...rows);
      })
      .catch((e: unknown) => {
        errors.himalayas = e instanceof Error ? e.message : "Unknown error";
      }),
    fetchCareerNestJobs(signal)
      .then((rows) => {
        out.push(...rows);
      })
      .catch((e: unknown) => {
        errors.careernest = e instanceof Error ? e.message : "Unknown error";
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
    isAdzunaConfigured()
      ? fetchAdzunaJobs(signal)
          .then((rows) => {
            out.push(...rows);
          })
          .catch((e: unknown) => {
            errors.adzuna = e instanceof Error ? e.message : "Unknown error";
          })
      : Promise.resolve(),
    isFindworkConfigured()
      ? fetchFindworkJobs(signal)
          .then((rows) => {
            out.push(...rows);
          })
          .catch((e: unknown) => {
            errors.findwork = e instanceof Error ? e.message : "Unknown error";
          })
      : Promise.resolve(),
    isJobdataConfigured()
      ? fetchJobdataJobs(signal)
          .then((rows) => {
            out.push(...rows);
          })
          .catch((e: unknown) => {
            errors.jobdataapi = e instanceof Error ? e.message : "Unknown error";
          })
      : Promise.resolve(),
    isCareerjetConfigured()
      ? fetchCareerjetJobs(signal)
          .then((rows) => {
            out.push(...rows);
          })
          .catch((e: unknown) => {
            errors.careerjet = e instanceof Error ? e.message : "Unknown error";
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
