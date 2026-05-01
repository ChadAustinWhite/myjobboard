import { profile } from "../data/profile";
import type { JobPosting } from "../types";

export function buildApplicationDraft(job: JobPosting): string {
  const topWin = profile.roles[0];

  const body = [
    `Hi ${job.company} team,`,
    ``,
    `I’m reaching out regarding the ${job.title} role. I’m ${profile.title} (${topWin.company}), focused on impactful, accessible product UX from discovery through delivery.`,
    ``,
    `Recent work includes cross-functional experimentation, prototyping and validation, and aligning design with measurable outcomes.`,
    ``,
    `Portfolio: ${profile.portfolioUrl}`,
    profile.email ? `Email: ${profile.email}` : "",
    `Best,`,
    profile.name,
  ]
    .filter(Boolean)
    .join("\n");

  return body;
}
