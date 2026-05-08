export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const tmdbPath = url.searchParams.get('_path') ?? '/trending/movie/week';
  const params = new URLSearchParams(url.searchParams);
  params.delete('_path');

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  params.set('api_key', apiKey);
  const tmdbUrl = `https://api.themoviedb.org/3${tmdbPath}?${params.toString()}`;

  try {
    const res = await fetch(tmdbUrl, { headers: { Accept: 'application/json' } });
    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to reach TMDB' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
