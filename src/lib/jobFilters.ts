import type { JobPosting } from "../types";

/**
 * Roles centered on graphic/visual/branding/marketing craft without UX or
 * product design ownership. Incoming listings are filtered against this too.
 */
export function isVisualOnlyDesignFocus(job: JobPosting): boolean {
  const blob = `${job.title} ${job.snippet} ${job.tags.join(" ")}`;

  const hasProductUxSignal =
    /\b(UX(?:\/?UI)?|user experience|product design(?:er)?|interaction design(?:er)?|service design(?:er)?|design systems\b|experience design\b|discovery\b|research[- ](?:backed|driven)|user research\b|UXR\b|\bworkflow(s)?\b|end[- ]to[- ]end\b|prototype|prototyping|IA\b|information architecture|usability|accessibility\b|WCAG\b)\b/i.test(
      blob,
    );

  if (hasProductUxSignal) return false;

  const title = job.title.toLowerCase();

  const titleVisualHeavy =
    /\bvisual\s+designer\b/.test(title) ||
    /\bgraphic\s+designer\b/.test(title) ||
    /\bmarketing\s+designer\b/.test(title) ||
    /\bbrand\s+designer\b/.test(title);

  const blobLower = blob.toLowerCase();

  const illustrationOrCampaign =
    /\billustration\b|\bcampaign\b|\bmarketing collateral\b|\bstyleframes\b|\bkey art\b|\blogo design\b|\bsocial creatives\b|\b(static|print)\s+ads\b|\bprint design\b/.test(
      blobLower,
    );

  const landingForMarketingOnly =
    /\blanding\s+pages?\s+and\s+brand\b|\bmarketing\s+(?:campaign|landing|team)\b/.test(blob);

  /** Tag-only lanes */
  const tags = job.tags.map((t) => t.toLowerCase());
  const uxishTag = tags.some((t) =>
    /ux|research|prototype|discovery|workflow|systems|interaction|experience|strategy/.test(t),
  );
  if (
    !uxishTag &&
    tags.includes("visual design") &&
    (tags.some((t) => t.includes("marketing")) ||
      tags.includes("illustration") ||
      tags.includes("graphic design"))
  )
    return true;

  return (
    titleVisualHeavy &&
    (illustrationOrCampaign || landingForMarketingOnly || tags.includes("marketing"))
  );
}
