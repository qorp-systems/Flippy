import { NextResponse } from 'next/server';
import { getFeedSWR } from '@/lib/news-engine/engine';
import type { FeedSourceConfig } from '@/lib/news-engine/types';

export const dynamic = 'force-dynamic';

function parseSources(rawSources: any): FeedSourceConfig[] | undefined {
  if (!Array.isArray(rawSources) || rawSources.length === 0) return undefined;
  return rawSources
    .filter(s => s && typeof s.url === 'string' && !s.isHidden)
    .map(s => ({
      id: String(s.id || s.name || 'custom'),
      name: String(s.name || 'Custom Feed'),
      url: String(s.url),
      category: s.category || 'general',
      region: s.region || 'br',
      brandColor: s.brandColor || '#29ABE2',
      enabled: true,
    }));
}

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
  const { articles, hasMore, total, snapshotVersion, source } = await getFeedSWR({
    region,
    category,
    page,
    limit,
  });
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

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const region = (body.region as 'br' | 'world') || undefined;
    const category = body.category || undefined;

    const rawPage = parseInt(body.page || '1', 10);
    const rawLimit = parseInt(body.limit || '15', 10);
    const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
    const limit = isNaN(rawLimit) || rawLimit < 1 ? 15 : Math.min(rawLimit, 50);

    const customSources = parseSources(body.sources);

    const start = performance.now();
    const { articles, hasMore, total, snapshotVersion, source } = await getFeedSWR({
      region,
      category,
      page,
      limit,
      customSources,
    });
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
          'X-Flippy-Cache': source,
          'X-Response-Time': `${latencyMs}ms`,
          'X-Snapshot-Ver': snapshotVersion,
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Erro ao carregar feed' },
      { status: 500 }
    );
  }
}
