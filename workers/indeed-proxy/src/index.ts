/**
 * Proxies Publisher search (/) plus optional JSON feeds:
 *   /adzuna   → api.adzuna.com (credentials in Worker secrets)
 *   /findwork → findwork.dev (Token auth)
 *   /jobdata  → jobdataapi.com (Api-Key auth)
 *   /careerjet → search.api.careerjet.net (Basic + Referer; user_ip via CF edge)
 *
 * SPA: keep `VITE_INDEED_PROXY_URL` pointing at worker origin (`/`). Set the same URL in
 * `VITE_JOB_APIS_PROXY_URL` for /adzuna /findwork /jobdata /careerjet.
 */

export interface Env {
  INDEED_PUBLISHER_ID: string;
  ALLOW_ORIGINS: string;

  ADZUNA_APP_ID?: string;
  ADZUNA_APP_KEY?: string;
  FINDWORK_API_TOKEN?: string;
  JOBDATA_API_KEY?: string;
  CAREERJET_API_KEY?: string;
  CAREERJET_REFERER?: string;
}

const INDEED_SEARCH = "https://api.indeed.com/ads/apisearch";

const PASS_ADZUNA = new Set([
  "country",
  "page",
  "what",
  "results_per_page",
  "where",
  "salary_min",
  "salary_max",
  "full_time",
  "permanent",
  "sort_by",
  "contract_type",
  "category",
]);
const PASS_FINDWORK = new Set(["search", "remote", "limit", "location", "employment_type", "page"]);
const PASS_JOBDATA = new Set([
  "title",
  "page",
  "page_size",
  "country_code",
  "has_remote",
  "language",
  "company_name",
  "include_agencies",
  "experience_level",
  "max_age",
  "published_since",
  "published_until",
  "city_name",
]);
const PASS_CAREERJET = new Set([
  "locale_code",
  "keywords",
  "location",
  "sort",
  "page",
  "page_size",
  "radius",
  "offset",
  "contract_type",
  "work_hours",
  "fragment_size",
]);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return withCors(request, new Response("", { status: 204 }), env);
    }

    if (request.method !== "GET") {
      return withCors(
        request,
        json({ ok: false, error: "Method not allowed" }, 405),
        env,
      );
    }

    const url = new URL(request.url);
    const path = normalizePath(url.pathname);

    if (!corsAllowed(request.headers.get("Origin"), env)) {
      return withCors(
        request,
        json({ ok: false, error: "Origin not allowed" }, 403),
        env,
      );
    }

    if (path === "/adzuna") return handleAdzuna(request, env, url.searchParams);
    if (path === "/findwork") return handleFindwork(request, env, url.searchParams);
    if (path === "/jobdata") return handleJobdata(request, env, url.searchParams);
    if (path === "/careerjet") return handleCareerjet(request, env, url.searchParams);
    if (path === "/" || path === "/indeed") return handleIndeed(request, env, url.searchParams);

    return withCors(request, json({ ok: false, error: `Unknown path (${path})` }, 404), env);
  },
};

function normalizePath(raw: string): string {
  if (!raw || raw === "/") return "/";
  if (raw.endsWith("/")) return raw.slice(0, -1) || "/";
  return raw;
}

async function handleAdzuna(
  request: Request,
  env: Env,
  q: URLSearchParams,
): Promise<Response> {
  const appId = env.ADZUNA_APP_ID?.trim();
  const appKey = env.ADZUNA_APP_KEY?.trim();
  if (!appId || !appKey) {
    return withCors(request, json({ ok: false, error: "ADZUNA_APP_ID / ADZUNA_APP_KEY unset" }, 503), env);
  }

  const country = (q.get("country") || "us").toLowerCase();
  const page = q.get("page") || "1";
  const up = new URL(
    `https://api.adzuna.com/v1/api/jobs/${encodeURIComponent(country)}/search/${encodeURIComponent(page)}`,
  );

  up.searchParams.set("app_id", appId);
  up.searchParams.set("app_key", appKey);
  up.searchParams.set("content-type", "application/json");

  for (const [k, v] of q.entries()) {
    if (PASS_ADZUNA.has(k) && k !== "country" && k !== "page" && v) {
      up.searchParams.set(k, v);
    }
  }

  return relayUpstream(request, env, `${up}`, { accept: "application/json" });
}

async function handleFindwork(request: Request, env: Env, q: URLSearchParams): Promise<Response> {
  const token = env.FINDWORK_API_TOKEN?.trim();
  if (!token) {
    return withCors(request, json({ ok: false, error: "FINDWORK_API_TOKEN unset" }, 503), env);
  }

  const up = new URL("https://findwork.dev/api/jobs/");
  for (const [k, v] of q.entries()) {
    if (PASS_FINDWORK.has(k) && v) up.searchParams.set(k, v);
  }

  return relayUpstream(request, env, `${up}`, {
    accept: "application/json",
    authorization: `Token ${token}`,
  });
}

async function handleJobdata(request: Request, env: Env, q: URLSearchParams): Promise<Response> {
  const key = env.JOBDATA_API_KEY?.trim();
  if (!key) {
    return withCors(request, json({ ok: false, error: "JOBDATA_API_KEY unset" }, 503), env);
  }

  const up = new URL("https://jobdataapi.com/api/jobs/");
  for (const [k, v] of q.entries()) {
    if (PASS_JOBDATA.has(k) && v) up.searchParams.set(k, v);
  }

  return relayUpstream(request, env, `${up}`, {
    accept: "application/json",
    authorization: `Api-Key ${key}`,
  });
}

async function handleCareerjet(request: Request, env: Env, q: URLSearchParams): Promise<Response> {
  const key = env.CAREERJET_API_KEY?.trim();
  const referer = env.CAREERJET_REFERER?.trim();
  if (!key || !referer) {
    return withCors(
      request,
      json({ ok: false, error: "CAREERJET_API_KEY or CAREERJET_REFERER unset" }, 503),
      env,
    );
  }

  const up = new URL("https://search.api.careerjet.net/v4/query");
  for (const [k, v] of q.entries()) {
    if (PASS_CAREERJET.has(k) && v) up.searchParams.set(k, v);
  }

  const userIp = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
  const userAgent =
    request.headers.get("User-Agent") || request.headers.get("X-Forwarded-UA") || "jobboard-worker/1";
  up.searchParams.set("user_ip", userIp);
  up.searchParams.set("user_agent", userAgent);

  const basic = "Basic " + btoa(`${key}:`);
  return relayUpstream(request, env, `${up}`, {
    accept: "application/json",
    authorization: basic,
    referer,
  });
}

type RelayHdrs = { accept: string; authorization?: string; referer?: string };

async function relayUpstream(
  request: Request,
  env: Env,
  upstreamUrl: string,
  hdrsIn: RelayHdrs,
): Promise<Response> {
  try {
    const hdrs = new Headers();
    hdrs.set("accept", hdrsIn.accept);
    if (hdrsIn.authorization) hdrs.set("authorization", hdrsIn.authorization);
    if (hdrsIn.referer) hdrs.set("Referer", hdrsIn.referer);

    const upstream = await fetch(upstreamUrl, {
      headers: hdrs,
    });

    const ct = upstream.headers.get("content-type") ?? "";
    const blob = await upstream.blob();

    if (!upstream.ok) {
      const txt = ct.includes("json") ? "" : "; non-json body";
      console.error("[job-proxy]", upstream.status, upstreamUrl.slice(0, 120), txt);
    }

    return withCors(
      request,
      new Response(blob, {
        status: upstream.status,
        headers: {
          "content-type": ct.includes("/") ? ct : "application/json; charset=utf-8",
          "cache-control": "private, max-age=120",
        },
      }),
      env,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[job-proxy]", msg);
    return withCors(
      request,
      json({ ok: false, error: `Upstream failed: ${msg}` }, 502),
      env,
    );
  }
}

async function handleIndeed(request: Request, env: Env, qp: URLSearchParams): Promise<Response> {
  if (!env.INDEED_PUBLISHER_ID?.trim()) {
    return withCors(
      request,
      json({ ok: false, error: "INDEED_PUBLISHER_ID is not configured" }, 503),
      env,
    );
  }

  const indeedParams = new URLSearchParams();
  indeedParams.set("publisher", env.INDEED_PUBLISHER_ID.trim());
  indeedParams.set("format", qp.get("format") || "json");
  indeedParams.set("v", qp.get("v") || "2");

  const passthroughKeys = [
    "q",
    "l",
    "sort",
    "radius",
    "st",
    "jt",
    "start",
    "limit",
    "fromage",
    "filter",
    "latlong",
    "co",
    "chnl",
  ];

  for (const key of passthroughKeys) {
    const val = qp.get(key);
    if (val != null && val !== "") indeedParams.set(key, val);
  }

  indeedParams.set("userip", request.headers.get("CF-Connecting-IP") || "0.0.0.0");
  indeedParams.set(
    "useragent",
    request.headers.get("User-Agent") || "myjobboard-indeed-proxy/1.0",
  );

  try {
    const upstream = await fetch(`${INDEED_SEARCH}?${indeedParams.toString()}`, {
      method: "GET",
      cf: {
        cacheTtl: 300,
        cacheEverything: false,
      },
    });

    if (!upstream.ok) {
      const body = await upstream.text();
      console.error("[indeed-proxy] Indeed HTTP", upstream.status, body.slice(0, 280));
      return withCors(
        request,
        json(
          {
            ok: false,
            error: `Indeed returned HTTP ${upstream.status}`,
            snippet: body.slice(0, 280),
          },
          502,
        ),
        env,
      );
    }

    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.includes("json")) {
      const txt = await upstream.text();
      return withCors(
        request,
        json(
          {
            ok: false,
            error: `Unexpected Indeed content-type (${contentType || "missing"})`,
            snippet: txt.slice(0, 280),
          },
          502,
        ),
        env,
      );
    }

    const blob = await upstream.blob();
    return withCors(
      request,
      new Response(blob, {
        status: upstream.status,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": upstream.headers.get("cache-control") ?? "private, max-age=300",
        },
      }),
      env,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[indeed-proxy]", msg);
    return withCors(
      request,
      json({ ok: false, error: `Indeed upstream failed: ${msg}` }, 502),
      env,
    );
  }
}

function json(payload: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function corsAllowed(origin: string | null, env: Env): boolean {
  if (!origin) return false;
  const list = env.ALLOW_ORIGINS.split(",").map((x) => x.trim()).filter(Boolean);
  return list.some((pattern) =>
    origin === pattern || (pattern.endsWith("*") && origin.startsWith(pattern.slice(0, -1))),
  );
}

/** Echo request Origin if allowed — required for credential-less cross-origin browser requests. */
function withCors(request: Request, res: Response, env: Env): Response {
  const origin = request.headers.get("Origin");
  const hdr = new Headers(res.headers);

  const list = env.ALLOW_ORIGINS.split(",").map((x) => x.trim()).filter(Boolean);
  let allowOrigin: string | null = null;

  if (origin && corsAllowed(origin, env)) {
    allowOrigin = origin;
  } else if (list.length === 1) {
    allowOrigin = list[0] ?? "";
  }

  if (allowOrigin && allowOrigin.length) {
    hdr.set("access-control-allow-origin", allowOrigin);
    hdr.set("vary", "Origin");
    hdr.set("access-control-allow-methods", "GET, OPTIONS");
    hdr.set(
      "access-control-allow-headers",
      request.headers.get("access-control-request-headers") ?? "*",
    );
  }

  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: hdr });
}
