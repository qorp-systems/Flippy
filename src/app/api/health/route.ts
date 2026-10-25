import { NextResponse } from 'next/server';
import { getEngineMetrics } from '@/lib/news-engine/engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  const metrics = getEngineMetrics();
  const memory = process.memoryUsage();

  const memorySummary = {
    rssMb: Math.round((memory.rss / (1024 * 1024)) * 10) / 10,
    heapUsedMb: Math.round((memory.heapUsed / (1024 * 1024)) * 10) / 10,
    heapTotalMb: Math.round((memory.heapTotal / (1024 * 1024)) * 10) / 10,
  };

  const sourcesStatus = metrics.sourcesHealth;
  const unhealthySources = Object.entries(sourcesStatus).filter(
    ([_, h]) => h.status === 'cooldown'
  );

  const status = unhealthySources.length > 5 ? 'degraded' : 'healthy';

  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    memory: memorySummary,
    metrics: {
      totalRequests: metrics.totalRequests,
      freshHits: metrics.freshHits,
      staleHits: metrics.staleHits,
      misses: metrics.misses,
      lastRevalidationAt: metrics.lastRevalidationAt || 'never',
      activeCacheEntries: metrics.cacheKeysCount,
    },
    sourcesHealthSummary: {
      totalTracked: Object.keys(sourcesStatus).length,
      cooldownCount: unhealthySources.length,
      details: sourcesStatus,
    },
  });
}
