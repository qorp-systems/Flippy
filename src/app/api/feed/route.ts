import { NextResponse } from 'next/server';
import { getFeedSWR } from '@/lib/news-engine/engine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = (searchParams.get('region') as 'br' | 'world') || undefined;
  const category = searchParams.get('category') || undefined;

  // Sanitização de parâmetros de paginação
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const rawLimit = parseInt(searchParams.get('limit') || '15', 10);
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const limit = isNaN(rawLimit) || rawLimit < 1 ? 15 : Math.min(rawLimit, 50);

  const start = performance.now();
  const { articles, hasMore, total, snapshotVersion, source } = await getFeedSWR({ region, category, page, limit });
  const latencyMs = Math.round(performance.now() - start);

  return NextResponse.json(
    {
      articles,
      hasMore,
      meta: {
        page,
        limit,
        total,
        snapshotVersion,
        returned: articles.length,
        cacheStatus: source,
        latencyMs,
      },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=1200',
        'X-Flippy-Cache': source,
        'X-Response-Time': `${latencyMs}ms`,
        'X-Snapshot-Ver': snapshotVersion,
      },
    }
  );
}
