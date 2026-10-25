const BROWSER_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
];

export interface SourceHealth {
  consecutiveFailures: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  lastLatencyMs?: number;
  status: 'healthy' | 'degraded' | 'cooldown';
}

const CIRCUIT_BREAKER_MAX_FAILURES = 3;
const CIRCUIT_BREAKER_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutos de cooldown
const healthRegistry = new Map<string, SourceHealth>();

export function getDomainKey(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function getSourceHealth(url: string): SourceHealth {
  const key = getDomainKey(url);
  const existing = healthRegistry.get(key);
  if (!existing) {
    return { consecutiveFailures: 0, status: 'healthy' };
  }

  // Verifica se o cooldown expirou
  if (existing.status === 'cooldown' && existing.lastFailureTime) {
    if (Date.now() - existing.lastFailureTime > CIRCUIT_BREAKER_COOLDOWN_MS) {
      existing.status = 'degraded';
      existing.consecutiveFailures = 1;
    }
  }

  return existing;
}

export function getAllSourcesHealth(): Record<string, SourceHealth> {
  const result: Record<string, SourceHealth> = {};
  for (const [key, value] of healthRegistry.entries()) {
    result[key] = { ...value };
  }
  return result;
}

export function recordSourceResult(url: string, success: boolean, latencyMs = 0): void {
  const key = getDomainKey(url);
  const current = healthRegistry.get(key) || { consecutiveFailures: 0, status: 'healthy' };

  if (success) {
    current.consecutiveFailures = 0;
    current.lastSuccessTime = Date.now();
    current.lastLatencyMs = latencyMs;
    current.status = 'healthy';
  } else {
    current.consecutiveFailures += 1;
    current.lastFailureTime = Date.now();
    current.lastLatencyMs = latencyMs;
    if (current.consecutiveFailures >= CIRCUIT_BREAKER_MAX_FAILURES) {
      current.status = 'cooldown';
    } else {
      current.status = 'degraded';
    }
  }

  healthRegistry.set(key, current);
}

export function getResilientHeaders(): HeadersInit {
  const ua = BROWSER_USER_AGENTS[Math.floor(Math.random() * BROWSER_USER_AGENTS.length)];
  return {
    'User-Agent': ua,
    'Accept': 'application/rss+xml, application/atom+xml, application/rdf+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  };
}

/**
 * Detecta e decodifica encoding do XML (UTF-8, ISO-8859-1, Windows-1252) evitando caracteres quebrados.
 */
function decodeBufferWithEncoding(buffer: ArrayBuffer, contentTypeHeader?: string | null): string {
  let encoding = 'utf-8';

  // 1. Checa header HTTP
  if (contentTypeHeader) {
    const match = contentTypeHeader.match(/charset=([a-zA-Z0-9_-]+)/i);
    if (match?.[1]) {
      encoding = match[1].toLowerCase();
    }
  }

  // 2. Se padrão utf-8, faz decodificação inicial para checar declaração <?xml ... encoding="..."?>
  const initialDecoder = new TextDecoder('utf-8', { fatal: false });
  const rawText = initialDecoder.decode(buffer);

  const xmlDeclMatch = rawText.slice(0, 150).match(/<\?xml[^>]+encoding=["']([^"']+)["']/i);
  if (xmlDeclMatch?.[1]) {
    const declaredEncoding = xmlDeclMatch[1].toLowerCase();
    if (declaredEncoding !== encoding && (declaredEncoding.includes('8859') || declaredEncoding.includes('1252') || declaredEncoding.includes('latin'))) {
      encoding = declaredEncoding;
    }
  }

  try {
    const decoder = new TextDecoder(encoding, { fatal: false });
    return decoder.decode(buffer);
  } catch {
    return rawText;
  }
}

export async function fetchWithTimeout(url: string, timeoutMs = 4000): Promise<string | null> {
  const health = getSourceHealth(url);
  if (health.status === 'cooldown') {
    // Fonte em quarentena para não bloquear requisições
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();

  try {
    const res = await fetch(url, {
      headers: getResilientHeaders(),
      signal: controller.signal,
      redirect: 'follow',
      cache: 'no-store',
    });
    clearTimeout(timer);

    const latency = Math.round(performance.now() - start);

    if (!res.ok) {
      recordSourceResult(url, false, latency);
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    const text = decodeBufferWithEncoding(arrayBuffer, res.headers.get('content-type'));

    recordSourceResult(url, true, latency);
    return text;
  } catch {
    clearTimeout(timer);
    const latency = Math.round(performance.now() - start);
    recordSourceResult(url, false, latency);
    return null;
  }
}
