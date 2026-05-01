/**
 * Proxies Indeed Publisher Job Search (`/ads/apisearch`) so Publisher ID stays off GitHub Pages.
 * Requires INDEED_PUBLISHER_ID (wrangler secret) and ALLOW_ORIGINS (comma-separated, no spaces).
 */

export interface Env {
  INDEED_PUBLISHER_ID: string;
  ALLOW_ORIGINS: string;
}

const INDEED_SEARCH = "https://api.indeed.com/ads/apisearch";

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

    if (!env.INDEED_PUBLISHER_ID?.trim()) {
      return withCors(
        request,
        json({ ok: false, error: "INDEED_PUBLISHER_ID is not configured" }, 503),
        env,
      );
    }

    const originAllowed = corsAllowed(request.headers.get("Origin"), env);
    if (!originAllowed) {
      return withCors(
        request,
        json({ ok: false, error: "Origin not allowed" }, 403),
        env,
      );
    }

    const url = new URL(request.url);

    /** Pass-through Indeed query params (`q`, `l`, `radius`, `start`, `limit`, `fromage`, `jt`, …) */
    const indeedParams = new URLSearchParams();
    indeedParams.set("publisher", env.INDEED_PUBLISHER_ID.trim());
    indeedParams.set("format", url.searchParams.get("format") || "json");
    indeedParams.set("v", url.searchParams.get("v") || "2");

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
      const val = url.searchParams.get(key);
      if (val != null && val !== "") indeedParams.set(key, val);
    }

    indeedParams.set("userip", request.headers.get("CF-Connecting-IP") || "0.0.0.0");
    indeedParams.set(
      "useragent",
      request.headers.get("User-Agent") || "myjobboard-indeed-proxy/1.0",
    );

    let upstream: Response;
    try {
      upstream = await fetch(`${INDEED_SEARCH}?${indeedParams.toString()}`, {
        method: "GET",
        cf: {
          cacheTtl: 300,
          cacheEverything: false,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[indeed-proxy] upstream fetch:", msg);
      return withCors(
        request,
        json({ ok: false, error: `Indeed upstream failed: ${msg}` }, 502),
        env,
      );
    }

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
  },
};

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
