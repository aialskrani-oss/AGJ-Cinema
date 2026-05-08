export const config = { runtime: 'edge' };

// ── Simple per-IP rate limiting (Edge-compatible: in-memory per invocation) ──
// For production-grade limiting use Upstash Redis or Vercel KV.
const RATE_LIMIT = 120; // requests allowed per window
const WINDOW_MS  = 60_000; // 1 minute
const ipMap      = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT) return true;
  return false;
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = ["https://agj-cinema-agj-cinema.vercel.app", "http://localhost:3000"];
  const acao = origin && allowed.some(o => origin.startsWith(o)) ? origin : allowed[0];
  return {
    "Access-Control-Allow-Origin": acao,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get("origin");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  // Only allow GET
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: "Too many requests. Please slow down." }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "60",
        ...corsHeaders(origin),
      },
    });
  }

  const url      = new URL(req.url);
  const tmdbPath = url.searchParams.get("_path") ?? "/trending/movie/week";
  const params   = new URLSearchParams(url.searchParams);
  params.delete("_path");

  // Validate path — only allow TMDB API paths
  if (!tmdbPath.startsWith("/")) {
    return new Response(JSON.stringify({ error: "Invalid path" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Server configuration error: TMDB_API_KEY is not set" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  params.set("api_key", apiKey);

  // Default to English; allow override via query param
  if (!params.has("language")) {
    params.set("language", "en-US");
  }

  const tmdbUrl = `https://api.themoviedb.org/3${tmdbPath}?${params.toString()}`;

  try {
    const res  = await fetch(tmdbUrl, { headers: { Accept: "application/json" } });
    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        ...corsHeaders(origin),
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to reach TMDB API" }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }
}
