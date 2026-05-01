import type { JobPosting } from "../types";

function textBlob(job: JobPosting): string {
  return `${job.location}\n${job.snippet}\n${job.tags.join(" ")}`.toLowerCase();
}

function mentionsUsSignals(t: string): boolean {
  if (
    /\b(united\s+states|\bu\.?\s*s\.?\s*a\.?\b|\bus\s+citizens?(?:ship)?|\bacross\s+(?:the\s+)?(?:united\s+states|\bu\.?s\.?)\b|continental\s+u\.?s\.?|located\s+(?:within|inside)\s+the\s+u\.?s\.?|puerto\s+rico)\b/.test(t)
  ) {
    return true;
  }

  if (/\bu\.?s\.?\s+time(?:zone)?s?\b|\bhiring\s+(?:within|inside)\s+the\s+u\.?s\.?\b/.test(t)) {
    return true;
  }

  if (
    /\b(alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|district\s+of\s+columbia|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new\s+hampshire|new\s+jersey|new\s+mexico|new\s+york|north\s+carolina|north\s+dakota|ohio|oklahoma|oregon|pennsylvania|rhode\s+island|south\s+carolina|south\s+dakota|tennessee|texas|utah|vermont|virginia|\bwashington\b(?!,? d\.?\s*c)|west\s+virginia|wisconsin|wyoming)\b/.test(
      t,
    )
  )
    return true;

  /** US city + state shorthand like “Chicago, IL” or “Boston, Ma” after lowercasing */
  if (
    /,\s*(al|ak|az|ar|ca|co|ct|dc|de|fl|ga|hi|ia|id|il|in|ks|ky|la|ma|md|me|mi|mn|mo|ms|mt|nc|nd|ne|nh|nj|nm|nv|ny|oh|ok|or|pa|pr|ri|sc|sd|tn|tx|ut|va|vt|wa|wi|wv|wy)\b/.test(t)
  )
    return true;

  /** Common shorthand cities / tech hubs inside the United States */
  if (
    /\b(silicon\s+valley|san francisco\b|los\s+angeles\b|greater\s+nyc\b|bay\s+area|greater\s+boston|greater\s+seattle|salt\s+lake\s+city|salt\s+lake\b|columbus,\s+ohio|greater\s+rdu\b|\brdu\b|research\s+triangle)\b/.test(t)
  )
    return true;

  return false;
}

/** Remote roles plainly locked outside the Americas / US-friendly corridor */
function remoteFailsNonUsExclusiveLock(blob: string): boolean {
  return /\b(?:eea|eu)\s+only\b|\b(?:uk|united\s+kingdom)\b.{0,26}\bonly\b|\bu\.?k\.?\s+only\b|\beurope(?:an)?\b.{0,40}\bonly\b|\bmust\b.{0,40}\b(?:located|living|based)\s+in\s+europe\b|\beuropean\b.{0,30}\btime\s*zones?\b|\beuropean\b.{0,20}\bhours\b|\bmust\b.{0,40}\b(?:within|inside)\s+the\s+e\.?u\.?\b|\bu\.?k\.?\s+hours\b|\blat(?:in)?(?:am)?\b.{0,20}\bhiring\b|\blatin america\b.{0,20}\bhiring\b|\b(?:india|china|pakistan|philippines|brazil|nigeria|kenya)\b.{0,24}\bonly\b|\b(?:asia|africa|middle\s+east)\s+only\b/.test(
    blob,
  );
}

/**
 * Roles that materially target the US labour market (on-site/local) plus remote gigs
 * that are not plainly EU/UK/APAC exclusive.
 */
export function geoMatchesUnitedStatesFocus(job: JobPosting): boolean {
  const blob = textBlob(job);

  if (job.remote) {
    if (mentionsUsSignals(blob)) return true;
    if (remoteFailsNonUsExclusiveLock(blob)) return false;
    /** Default: unrestricted remote gigs are treated as workable from the US */
    return true;
  }

  if (mentionsUsSignals(blob)) return true;

  /** Drop obvious offshore-only postings */
  if (
    /\b(?:berlin\b|munich\b|singapore\b|tokyo\b|taipei\b|mumbai\b|hyderabad\b|toronto\b|vancouver\b|montreal\b|lisbon\b|budapest\b|warsaw\b|prague\b|mexico\s+city\b|são\s+paulo|sydney\b|tel\s+aviv)\b/.test(blob)
  )
    return false;

  /** No reliable US anchors */
  return false;
}
