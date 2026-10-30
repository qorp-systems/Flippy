import { SEED_SOURCES } from './sources';
import { fetchWithTimeout, getAllSourcesHealth } from './http-client';
import { parseFeed } from './feed-parser';
import { applyQualityGates } from './quality-gate';
import { generateCompactHash } from './hash';
import type { CleanArticle, FeedSourceConfig } from './types';

interface CacheEntry {
  articles: CleanArticle[];
  timestamp: number;
  snapshotVersion: string;
  isRevalidating?: boolean;
}

export interface EngineMetrics {
  totalRequests: number;
  freshHits: number;
  staleHits: number;
  misses: number;
  lastRevalidationAt?: string;
  cacheKeysCount: number;
  sourcesHealth: ReturnType<typeof getAllSourcesHealth>;
}

const FRESH_TTL_MS = 4 * 60 * 1000;      // 4 minutos: responde na hora da RAM
const STALE_TTL_MS = 60 * 60 * 1000;     // 1 hora: responde stale e revalida em background
const DEFAULT_PAGE_SIZE = 15;

declare global {
  var __flippy_news_cache__: Map<string, CacheEntry> | undefined;
  var __flippy_metrics__: {
    totalRequests: number;
    freshHits: number;
    staleHits: number;
    misses: number;
    lastRevalidationAt?: string;
  } | undefined;
  var __flippy_in_flight__: Map<string, Promise<CleanArticle[]>> | undefined;
  var __flippy_article_history__: Map<string, CleanArticle> | undefined;
}

const cache = globalThis.__flippy_news_cache__ ?? new Map<string, CacheEntry>();
globalThis.__flippy_news_cache__ = cache;

const articleHistory = globalThis.__flippy_article_history__ ?? new Map<string, CleanArticle>();
globalThis.__flippy_article_history__ = articleHistory;

function rememberArticles(articles: CleanArticle[]) {
  for (const a of articles) {
    if (a.id) {
      articleHistory.set(a.id, a);
    }
  }
  if (articleHistory.size > 1000) {
    const it = articleHistory.keys();
    for (let i = 0; i < 200; i++) {
      const nextKey = it.next().value;
      if (nextKey) articleHistory.delete(nextKey);
    }
  }
}

const metrics = globalThis.__flippy_metrics__ ?? {
  totalRequests: 0,
  freshHits: 0,
  staleHits: 0,
  misses: 0,
};
globalThis.__flippy_metrics__ = metrics;

// Single-flight promise coalescing map: impede stampede de requests repetidas
const inFlightRequests = globalThis.__flippy_in_flight__ ?? new Map<string, Promise<CleanArticle[]>>();
globalThis.__flippy_in_flight__ = inFlightRequests;

export async function fetchFromSource(source: FeedSourceConfig): Promise<CleanArticle[]> {
  try {
    const xml = await fetchWithTimeout(source.url, 4000);
    if (!xml) return [];
    return await parseFeed(xml, source);
  } catch {
    return [];
  }
}

export async function aggregateFeeds(options?: {
  region?: 'br' | 'world';
  category?: string;
  customSources?: FeedSourceConfig[];
}): Promise<CleanArticle[]> {
  const sourcesToFetch = (options?.customSources || SEED_SOURCES).filter(s => {
    if (s.enabled === false) return false;
    if (options?.region && s.region !== options.region) return false;
    if (options?.category && options.category !== 'all' && s.category !== options.category) return false;
    return true;
  });

  const results = await Promise.allSettled(sourcesToFetch.map(s => fetchFromSource(s)));
  const allArticles: CleanArticle[] = [];

  for (const res of results) {
    if (res.status === 'fulfilled' && res.value.length > 0) {
      allArticles.push(...res.value);
    }
  }

  // Ordena preliminarmente por data decrescente
  allArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  // Aplica Quality Gates: Frescor, Imagens válidas, Deduplicação e Segmentação por Janela Temporal
  return applyQualityGates(allArticles);
}

/**
 * Padrão Single-Flight: se já existir uma coleta em andamento para a mesma chave,
 * todas as requisições aguardam a mesma Promise sem disparar novas chamadas HTTP externas.
 */
function singleFlightAggregate(key: string, options?: { region?: 'br' | 'world'; category?: string; customSources?: FeedSourceConfig[] }): Promise<CleanArticle[]> {
  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing;
  }

  const promise = aggregateFeeds(options)
    .then(articles => {
      metrics.lastRevalidationAt = new Date().toISOString();
      return articles;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, promise);
  return promise;
}

export async function getFeedSWR(options?: {
  region?: 'br' | 'world';
  category?: string;
  page?: number;
  limit?: number;
  customSources?: FeedSourceConfig[];
}): Promise<{
  articles: CleanArticle[];
  hasMore: boolean;
  total: number;
  snapshotVersion: string;
  source: 'FRESH' | 'STALE' | 'MISS';
}> {
  metrics.totalRequests += 1;
  const customHash = options?.customSources && options.customSources.length > 0
    ? `:custom:${generateCompactHash(options.customSources.map(s => s.url).sort().join(','))}`
    : '';
  const key = `${options?.region || 'all'}:${options?.category || 'all'}${customHash}`;
  const page = Math.max(1, options?.page || 1);
  const limit = Math.max(1, options?.limit || DEFAULT_PAGE_SIZE);

  let cached = cache.get(key);
  const now = Date.now();
  let cacheSource: 'FRESH' | 'STALE' | 'MISS' = 'MISS';

  // 1. FRESH HIT (< 4 minutos)
  if (cached && now - cached.timestamp < FRESH_TTL_MS) {
    cacheSource = 'FRESH';
    metrics.freshHits += 1;
  }
  // 2. STALE HIT (< 1 hora) -> Responde na hora e atualiza em background com Single-Flight
  else if (cached && now - cached.timestamp < STALE_TTL_MS) {
    cacheSource = 'STALE';
    metrics.staleHits += 1;
    const entry = cached;
    if (!entry.isRevalidating) {
      entry.isRevalidating = true;
      singleFlightAggregate(key, options)
        .then(freshArticles => {
          if (freshArticles.length > 0) {
            rememberArticles(freshArticles);
            cache.set(key, {
              articles: freshArticles,
              timestamp: Date.now(),
              snapshotVersion: new Date().toISOString(),
              isRevalidating: false,
            });
          } else {
            entry.isRevalidating = false;
          }
        })
        .catch(() => {
          entry.isRevalidating = false;
        });
    }
  }
  // 3. CACHE MISS -> Busca imediata unificada via Single-Flight
  else {
    cacheSource = 'MISS';
    metrics.misses += 1;
    const fresh = await singleFlightAggregate(key, options);
    const snapshotVer = new Date().toISOString();
    if (fresh.length > 0) {
      rememberArticles(fresh);
      const newEntry: CacheEntry = {
        articles: fresh,
        timestamp: now,
        snapshotVersion: snapshotVer,
        isRevalidating: false,
      };
      cache.set(key, newEntry);
      cached = newEntry;
    }
  }

  const all = cached?.articles || [];
  const start = (page - 1) * limit;
  const paginatedArticles = all.slice(start, start + limit);
  const hasMore = all.length > start + limit;

  return {
    articles: paginatedArticles,
    hasMore,
    total: all.length,
    snapshotVersion: cached?.snapshotVersion || 'v0',
    source: cacheSource,
  };
}

export async function getArticleById(id: string): Promise<CleanArticle | null> {
  if (!id) return null;

  // 1. Procurar no histórico indexado
  if (articleHistory.has(id)) {
    return articleHistory.get(id)!;
  }

  // 2. Procurar em todos os caches ativos em memória
  for (const entry of cache.values()) {
    const found = entry.articles.find(a => a.id === id);
    if (found) {
      articleHistory.set(id, found);
      return found;
    }
  }

  // 3. Se não estiver no cache imediato, dispara a busca do feed
  try {
    const feed = await getFeedSWR();
    for (const a of feed.articles) {
      articleHistory.set(a.id, a);
    }
    return articleHistory.get(id) || null;
  } catch (err) {
    console.error('[engine] Erro ao buscar artigo por ID:', err);
    return null;
  }
}

export function getEngineMetrics(): EngineMetrics {
  return {
    ...metrics,
    cacheKeysCount: cache.size,
    sourcesHealth: getAllSourcesHealth(),
  };
}

export async function forceRevalidate(options?: { region?: 'br' | 'world'; category?: string }): Promise<number> {
  const key = `${options?.region || 'all'}:${options?.category || 'all'}`;
  const fresh = await singleFlightAggregate(key, options);
  if (fresh.length > 0) {
    cache.set(key, {
      articles: fresh,
      timestamp: Date.now(),
      snapshotVersion: new Date().toISOString(),
      isRevalidating: false,
    });
  }
  return fresh.length;
}
