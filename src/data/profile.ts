/** Derived from Chad White resume + portfolio signals for matching and drafts */

export const profile = {
  name: "Chad Austin White",
  handle: "chadaustinwhite",
  title: "UX Designer III",
  location: "Remote / US",
  email: "chadaustinwhite@gmail.com",
  portfolioUrl: "https://chadaustinwhite.github.io",
  linkedInHint: "LinkedIn / Threads (see resume)",
  summary:
    "UX designer focused on high-impact product work: discovery through delivery, cross-functional collaboration, accessibility (WCAG 2.1/2.2), and measurable business outcomes.",

  roles: [
    {
      title: "UX Designer III",
      company: "Expedia Group",
      period: "May 2022 – Present",
      highlights: [
        "Design iterations tied to significant revenue and booking value outcomes",
        "Engagement and retention lifts through behavioral design and research",
      ],
    },
    {
      title: "Lead UX Designer",
      company: "First American Title",
      period: "Jun 2020 – May 2022",
      highlights: [
        "Scaled adoption for an underwriting platform across 25k+ users",
        "Workshops, prototyping, and usability-led workflow simplification",
      ],
    },
    {
      title: "UX Designer",
      company: "Car Finance Capital",
      period: "Apr 2019 – Apr 2020",
      highlights: [
        "Growth to 100k users via research-informed purchase/refi flows",
        "End-to-end flows, specs, and engineering partnership",
      ],
    },
  ],

  strengths: [
    "ux design",
    "product design",
    "user research",
    "design systems",
    "figma",
    "prototyping",
    "usability",
    "accessibility",
    "wcag",
    "information architecture",
    "cross-functional collaboration",
    "experimentation",
    "analytics-informed design",
    "workshop facilitation",
    "jira",
    "confluence",
    "content design partnerships",
    "travel",
    "hospitality",
    "fin tech",
    "fintech",
    "enterprise software",
    "b2b",
    "workflow",
  ],

  tools: [
    "figma",
    "cursor",
    "github",
    "usertesting",
    "google analytics",
    "adobe creative cloud",
    "miro",
    "html",
    "css",
  ],
} as const;

export type Profile = typeof profile;
