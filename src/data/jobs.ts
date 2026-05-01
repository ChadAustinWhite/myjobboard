import type { JobPosting } from "../types";

/** Starter feed—swap for API/RSS in production */
export const seedJobs: JobPosting[] = [
  {
    id: "job-001",
    company: "Nimbus Travel Co.",
    title: "Senior Product Designer — Guest Experience",
    postedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    snippet:
      "Lead design for hospitality booking journeys. Strong Figma chops, prototyping, and comfort with experimentation. Partner with PM/Eng on discovery and iterative delivery.",
    applyUrl: "https://example.com/apply/nimbus-guest-exp",
    location: "Seattle, WA",
    remote: true,
    tags: ["product design", "travel", "figma", "experimentation"],
    source: "demo_feed",
  },
  {
    id: "job-002",
    company: "Harbor Capital",
    title: "UX Designer II — Lending Platform",
    postedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    snippet:
      "Redesign underwriting and servicing flows for scale. Workshops with Legal/Ops; ship accessible UI (WCAG 2.1 AA); partner with engineers on pragmatic systems.",
    applyUrl: "https://example.com/apply/harbor-lending-ux",
    location: "Irvine, CA",
    remote: true,
    tags: ["ux", "fintech", "workshops", "wcag", "jira"],
    source: "demo_feed",
  },
  {
    id: "job-004",
    company: "Atlas Enterprise",
    title: "Staff UX Designer — Design Systems",
    postedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    snippet:
      "Evolve a multi-brand design system. Accessibility champion, documentation, Figma libraries, and enablement for PM/Eng partners across squads.",
    applyUrl: "https://example.com/apply/atlas-ds",
    location: "Austin, TX",
    remote: true,
    tags: ["design systems", "accessibility", "figma", "documentation", "wcag"],
    source: "demo_feed",
  },
  {
    id: "job-005",
    company: "Brightline Research",
    title: "UX Researcher (Quant + Qual)",
    postedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    snippet:
      "Primary focus on survey design, statistical analysis, and vendor studies. Design craft is secondary.",
    applyUrl: "https://example.com/apply/brightline-uxr",
    location: "Remote",
    remote: true,
    tags: ["research", "quant", "survey", "statistics"],
    source: "demo_feed",
  },
  {
    id: "job-006",
    company: "Summit Insurance",
    title: "Lead Product Designer — Policyholder Portal",
    postedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    snippet:
      "End-to-end UX for complex policy workflows. Run discovery, prototype in Figma, validate with UserTesting, ship with eng. Enterprise B2B.",
    applyUrl: "https://example.com/apply/summit-portal",
    location: "Remote — US",
    remote: true,
    tags: ["product design", "enterprise", "usertesting", "figma", "prototyping"],
    source: "demo_feed",
  },
];
