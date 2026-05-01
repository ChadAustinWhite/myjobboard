import { profile } from "../data/profile";
import type { JobPosting } from "../types";

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/** 0–100 rough fit score from resume-aligned keywords */
export function computeMatchScore(job: JobPosting): number {
  const blob = normalize(`${job.title} ${job.snippet} ${job.tags.join(" ")}`);

  const tokens = new Set<string>();
  const add = (t: string) => {
    normalize(t)
      .split(/[^a-z0-9+/]+/)
      .filter((w) => w.length >= 3)
      .forEach((w) => tokens.add(w));
  };

  for (const k of profile.strengths) add(k);
  for (const k of profile.tools) add(k);
  for (const r of profile.roles) {
    add(r.title);
    add(r.company);
  }

  const jobTokens = new Set(
    normalize(blob)
      .split(/[^a-z0-9+/]+/)
      .filter((w) => w.length >= 3),
  );

  let overlap = 0;
  for (const t of tokens) {
    if (jobTokens.has(t)) overlap++;
  }

  /** Phrase boosts (strong signals) */
  const phrases = [
    "ux ",
    " product design",
    "design system",
    "accessibility",
    "wcag",
    "prototype",
    "figma",
    "cross-functional",
    "experiment",
    "usertesting",
    "travel",
    "hospitality",
    "enterprise",
    "workflow",
    "underwriting",
  ];
  let phraseBonus = 0;
  for (const p of phrases) {
    if (blob.includes(p.trim())) phraseBonus += 6;
  }

  const base = Math.min(100, overlap * 5 + phraseBonus);
  return Math.max(0, Math.min(100, Math.round(base)));
}

export function tierFromScore(score: number): "strong" | "good" | "weak" {
  if (score >= 72) return "strong";
  if (score >= 48) return "good";
  return "weak";
}
