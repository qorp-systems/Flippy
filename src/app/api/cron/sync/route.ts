import { NextResponse } from 'next/server';
import { forceRevalidate } from '@/lib/news-engine/engine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Se CRON_SECRET estiver definido, valida bearer token ou query param ?token=...
  if (cronSecret) {
    const bearer = authHeader?.replace(/^Bearer\s+/i, '');
    const token = searchParams.get('token');
    if (bearer !== cronSecret && token !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const start = performance.now();
  // Pré-aquece os principais canais em paralelo
  const [brCount, worldCount, techCount, allCount] = await Promise.all([
    forceRevalidate({ region: 'br' }),
    forceRevalidate({ region: 'world' }),
    forceRevalidate({ category: 'tech' }),
    forceRevalidate(),
  ]);

  const latencyMs = Math.round(performance.now() - start);

  return NextResponse.json({
    status: 'ok',
    syncedAt: new Date().toISOString(),
    durationMs: latencyMs,
    revalidated: {
      all: allCount,
      br: brCount,
      world: worldCount,
      tech: techCount,
    },
  });
}
