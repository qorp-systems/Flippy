import { fetchWithTimeout } from './http-client';
import { generateCompactHash } from './hash';
import { validateExternalUrl } from '@/lib/security';
import type { FeedSourceConfig } from './types';

export interface CuratedSource {
  id: string;
  name: string;
  url: string;
  category: 'general' | 'politics' | 'economy' | 'tech' | 'world';
  region: 'br' | 'world';
  brandColor: string;
  keywords: string[];
}

export const CURATED_PORTALS: CuratedSource[] = [
  // Brasil Geral & Política
  {
    id: 'g1-geral',
    name: 'G1',
    url: 'https://g1.globo.com/rss/g1/',
    category: 'general',
    region: 'br',
    brandColor: '#c4170c',
    keywords: ['g1', 'globo', 'g1 brasil', 'globo noticias'],
  },
  {
    id: 'g1-economia',
    name: 'G1 Economia',
    url: 'https://g1.globo.com/rss/g1/economia/',
    category: 'economy',
    region: 'br',
    brandColor: '#c4170c',
    keywords: ['g1 economia', 'globo economia'],
  },
  {
    id: 'g1-politica',
    name: 'G1 Política',
    url: 'https://g1.globo.com/rss/g1/politica/',
    category: 'politics',
    region: 'br',
    brandColor: '#c4170c',
    keywords: ['g1 politica', 'globo politica'],
  },
  {
    id: 'ge-esportes',
    name: 'GE Globo Esporte',
    url: 'https://ge.globo.com/rss/globoesporte/',
    category: 'general',
    region: 'br',
    brandColor: '#06aa48',
    keywords: ['ge', 'globoesporte', 'globo esporte', 'futebol', 'esportes'],
  },
  {
    id: 'folha-sp',
    name: 'Folha de S.Paulo',
    url: 'https://feeds.folha.uol.com.br/emcimadahora/rss091.xml',
    category: 'general',
    region: 'br',
    brandColor: '#004b87',
    keywords: ['folha', 'folha de sao paulo', 'folha de s.paulo', 'fsp'],
  },
  {
    id: 'estadao',
    name: 'Estadão',
    url: 'https://www.estadao.com.br/rss/ultimas.xml',
    category: 'general',
    region: 'br',
    brandColor: '#005088',
    keywords: ['estadao', 'estadão', 'o estado de s. paulo'],
  },
  {
    id: 'uol-noticias',
    name: 'UOL Notícias',
    url: 'https://rss.uol.com.br/feed/noticias.xml',
    category: 'general',
    region: 'br',
    brandColor: '#ff7f00',
    keywords: ['uol', 'uol noticias', 'universo online'],
  },
  {
    id: 'uol-economia',
    name: 'UOL Economia',
    url: 'https://rss.uol.com.br/feed/economia.xml',
    category: 'economy',
    region: 'br',
    brandColor: '#ff7f00',
    keywords: ['uol economia', 'uol mercado'],
  },
  {
    id: 'cnn-brasil',
    name: 'CNN Brasil',
    url: 'https://www.cnnbrasil.com.br/feed/',
    category: 'general',
    region: 'br',
    brandColor: '#cc0000',
    keywords: ['cnn', 'cnn brasil'],
  },
  {
    id: 'bbc-brasil',
    name: 'BBC News Brasil',
    url: 'https://feeds.bbci.co.uk/portuguese/rss.xml',
    category: 'general',
    region: 'br',
    brandColor: '#bb1919',
    keywords: ['bbc', 'bbc brasil', 'bbc news brasil'],
  },
  {
    id: 'agencia-brasil',
    name: 'Agência Brasil',
    url: 'https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml',
    category: 'general',
    region: 'br',
    brandColor: '#009b3a',
    keywords: ['agencia brasil', 'agência brasil', 'ebc'],
  },
  {
    id: 'poder360',
    name: 'Poder360',
    url: 'https://www.poder360.com.br/feed/',
    category: 'politics',
    region: 'br',
    brandColor: '#1a56a2',
    keywords: ['poder360', 'poder 360', 'drive'],
  },
  {
    id: 'metropoles',
    name: 'Metrópoles',
    url: 'https://www.metropoles.com/feed',
    category: 'general',
    region: 'br',
    brandColor: '#ea1d2c',
    keywords: ['metropoles', 'metrópoles'],
  },
  {
    id: 'cartacapital',
    name: 'CartaCapital',
    url: 'https://www.cartacapital.com.br/feed/',
    category: 'politics',
    region: 'br',
    brandColor: '#c00000',
    keywords: ['cartacapital', 'carta capital'],
  },
  {
    id: 'intercept-brasil',
    name: 'The Intercept Brasil',
    url: 'https://theintercept.com/feed/?lang=pt',
    category: 'politics',
    region: 'br',
    brandColor: '#222222',
    keywords: ['intercept', 'the intercept', 'intercept brasil'],
  },
  {
    id: 'brasil247',
    name: 'Brasil 247',
    url: 'https://www.brasil247.com/feed',
    category: 'politics',
    region: 'br',
    brandColor: '#002f6c',
    keywords: ['brasil 247', 'brasil247'],
  },
  {
    id: 'nexo-jornal',
    name: 'Nexo Jornal',
    url: 'https://www.nexojornal.com.br/rss.xml',
    category: 'politics',
    region: 'br',
    brandColor: '#2b2b2b',
    keywords: ['nexo', 'nexo jornal'],
  },

  // Tecnologia & Inovação
  {
    id: 'tecnoblog',
    name: 'Tecnoblog',
    url: 'https://tecnoblog.net/feed/',
    category: 'tech',
    region: 'br',
    brandColor: '#ff8000',
    keywords: ['tecnoblog', 'tb', 'tecnologia'],
  },
  {
    id: 'olhar-digital',
    name: 'Olhar Digital',
    url: 'https://olhardigital.com.br/feed/',
    category: 'tech',
    region: 'br',
    brandColor: '#0070f3',
    keywords: ['olhar digital', 'olhardigital'],
  },
  {
    id: 'tecmundo',
    name: 'TecMundo',
    url: 'https://rss.tecmundo.com.br/feed',
    category: 'tech',
    region: 'br',
    brandColor: '#0084ff',
    keywords: ['tecmundo', 'tec mundo', 'nzm'],
  },
  {
    id: 'canaltech',
    name: 'Canaltech',
    url: 'https://canaltech.com.br/rss/',
    category: 'tech',
    region: 'br',
    brandColor: '#e63946',
    keywords: ['canaltech', 'canal tech'],
  },
  {
    id: 'g1-tecnologia',
    name: 'G1 Tecnologia',
    url: 'https://g1.globo.com/rss/g1/tecnologia/',
    category: 'tech',
    region: 'br',
    brandColor: '#c4170c',
    keywords: ['g1 tecnologia', 'g1 tech'],
  },
  {
    id: 'uol-tilt',
    name: 'UOL Tilt',
    url: 'https://rss.uol.com.br/feed/tecnologia.xml',
    category: 'tech',
    region: 'br',
    brandColor: '#ff7f00',
    keywords: ['uol tilt', 'tilt', 'uol tecnologia'],
  },
  {
    id: 'the-verge',
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    category: 'tech',
    region: 'world',
    brandColor: '#e01258',
    keywords: ['the verge', 'verge'],
  },
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'tech',
    region: 'world',
    brandColor: '#029a00',
    keywords: ['techcrunch', 'tc', 'startups'],
  },
  {
    id: 'wired',
    name: 'Wired',
    url: 'https://www.wired.com/feed/rss',
    category: 'tech',
    region: 'world',
    brandColor: '#111111',
    keywords: ['wired'],
  },
  {
    id: 'ars-technica',
    name: 'Ars Technica',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    category: 'tech',
    region: 'world',
    brandColor: '#ff4e00',
    keywords: ['ars technica', 'arstechnica'],
  },

  // Economia & Negócios
  {
    id: 'valor-economico',
    name: 'Valor Econômico',
    url: 'https://valor.globo.com/rss/home/',
    category: 'economy',
    region: 'br',
    brandColor: '#124373',
    keywords: ['valor economico', 'valor econômico', 'valor'],
  },
  {
    id: 'infomoney',
    name: 'InfoMoney',
    url: 'https://www.infomoney.com.br/feed/',
    category: 'economy',
    region: 'br',
    brandColor: '#0a192f',
    keywords: ['infomoney', 'info money'],
  },
  {
    id: 'exame',
    name: 'Exame',
    url: 'https://exame.com/feed/',
    category: 'economy',
    region: 'br',
    brandColor: '#0d1b2a',
    keywords: ['exame', 'revista exame'],
  },

  // Internacional & Mundo
  {
    id: 'bbc-world',
    name: 'BBC World News',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'world',
    region: 'world',
    brandColor: '#bb1919',
    keywords: ['bbc world', 'bbc world news', 'bbc ingles'],
  },
  {
    id: 'dw-brasil',
    name: 'DW Brasil',
    url: 'https://rss.dw.com/rdf/rss-pt-br-all',
    category: 'world',
    region: 'world',
    brandColor: '#0055aa',
    keywords: ['dw', 'dw brasil', 'deutsche welle'],
  },
  {
    id: 'al-jazeera',
    name: 'Al Jazeera',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    category: 'world',
    region: 'world',
    brandColor: '#f38a00',
    keywords: ['al jazeera', 'aljazeera'],
  },
  {
    id: 'reuters',
    name: 'Reuters',
    url: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best',
    category: 'world',
    region: 'world',
    brandColor: '#ff8000',
    keywords: ['reuters'],
  },
  {
    id: 'nyt-world',
    name: 'The New York Times',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    category: 'world',
    region: 'world',
    brandColor: '#121212',
    keywords: ['nyt', 'new york times'],
  },
];

// Cores de marca automáticas com boa legibilidade e harmonia visual
const BRAND_PALETTE = [
  '#0070f3', '#7928ca', '#f5a623', '#10b981', '#06b6d4',
  '#3b82f6', '#ec4899', '#f43f5e', '#8b5cf6', '#14b8a6',
  '#e11d48', '#d97706', '#2563eb', '#059669', '#4f46e5'
];

function generateBrandColor(input: string): string {
  const hash = generateCompactHash(input);
  const num = parseInt(hash.slice(0, 4), 16);
  return BRAND_PALETTE[num % BRAND_PALETTE.length];
}

function cleanFeedTitle(title: string): string {
  return title
    .replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s*[-–|:]\s*(RSS|Feed|Últimas Notícias|Notícias|Home|Geral|Brasil).*$/i, '')
    .trim();
}

/**
 * Verifica se um texto recebido é um feed RSS / Atom / XML válido
 */
function isXmlFeed(content: string): boolean {
  if (!content || typeof content !== 'string') return false;
  const start = content.slice(0, 500).toLowerCase();
  return (
    start.includes('<rss') ||
    start.includes('<feed') ||
    start.includes('<channel') ||
    (start.includes('<?xml') && (start.includes('rss') || start.includes('atom') || start.includes('feed')))
  );
}

/**
 * Extrai o feed diretamente do XML
 */
function parseFeedInfoFromXml(xml: string, feedUrl: string): FeedSourceConfig {
  const titleMatch =
    xml.match(/<channel[^>]*>[\s\S]*?<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i) ||
    xml.match(/<feed[^>]*>[\s\S]*?<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);

  let rawTitle = titleMatch?.[1]?.trim() || '';
  if (rawTitle.includes('<')) {
    rawTitle = rawTitle.replace(/<[^>]+>/g, '').trim();
  }

  let domain = '';
  try {
    domain = new URL(feedUrl).hostname.replace(/^www\./, '');
  } catch {
    domain = 'feed';
  }

  const name = rawTitle ? cleanFeedTitle(rawTitle) : domain;
  const isBr = domain.endsWith('.br') || xml.includes('pt-BR') || xml.includes('pt-br') || xml.includes('portuguese');

  let category: FeedSourceConfig['category'] = 'general';
  const lowerUrl = feedUrl.toLowerCase();
  const lowerName = name.toLowerCase();
  if (lowerUrl.includes('tech') || lowerUrl.includes('tecnologia') || lowerName.includes('tech')) category = 'tech';
  else if (lowerUrl.includes('econom') || lowerName.includes('econom')) category = 'economy';
  else if (lowerUrl.includes('polit') || lowerName.includes('polít')) category = 'politics';
  else if (!isBr) category = 'world';

  return {
    id: domain.replace(/[^a-z0-9]/gi, '-').toLowerCase() || `feed-${generateCompactHash(feedUrl)}`,
    name,
    url: feedUrl,
    category,
    region: isBr ? 'br' : 'world',
    brandColor: generateBrandColor(domain || name),
    enabled: true,
  };
}

/**
 * Encontra a tag <link rel="alternate" type="application/rss+xml"> em HTML
 */
function extractFeedLinkFromHtml(html: string, baseUrl: string): string | null {
  // Regex 1: type antes do href
  const matchTypeFirst = html.match(/<link[^>]+type=["']application\/(rss\+xml|atom\+xml|rdf\+xml)["'][^>]+href=["']([^"']+)["']/i);
  if (matchTypeFirst?.[2]) {
    return resolveUrl(matchTypeFirst[2], baseUrl);
  }

  // Regex 2: href antes do type
  const matchHrefFirst = html.match(/<link[^>]+href=["']([^"']+)["'][^>]+type=["']application\/(rss\+xml|atom\+xml|rdf\+xml)["']/i);
  if (matchHrefFirst?.[1]) {
    return resolveUrl(matchHrefFirst[1], baseUrl);
  }

  // Regex 3: <link rel="alternate" href="..."> com rss/atom no href
  const matchRelFirst = html.match(/<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']*(?:rss|feed|atom)[^"']*)["']/i);
  if (matchRelFirst?.[1]) {
    return resolveUrl(matchRelFirst[1], baseUrl);
  }

  return null;
}

function resolveUrl(relativeOrAbsolute: string, baseUrl: string): string {
  if (relativeOrAbsolute.startsWith('http://') || relativeOrAbsolute.startsWith('https://')) {
    return relativeOrAbsolute;
  }
  try {
    return new URL(relativeOrAbsolute, baseUrl).toString();
  } catch {
    return relativeOrAbsolute;
  }
}

/**
 * Busca por caminhos comuns de feed (ex: /feed, /rss, /rss.xml)
 */
async function probeCommonFeedPaths(targetUrl: string): Promise<string | null> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    return null;
  }

  const origin = parsedUrl.origin;
  const pathPrefix = parsedUrl.pathname.replace(/\/+$/, '');

  const candidatePaths = [
    '/feed',
    '/rss',
    '/feed.xml',
    '/rss.xml',
    '/atom.xml',
    '/index.xml',
    '/?feed=rss2',
    '/feed/rss',
    '/feed/atom',
  ];

  // Adiciona candidatos relativos ao path atual se houver subdiretório (ex: /tecnologia/feed)
  const allUrls: string[] = [];
  if (pathPrefix && pathPrefix !== '/') {
    candidatePaths.forEach(p => allUrls.push(`${origin}${pathPrefix}${p}`));
  }
  candidatePaths.forEach(p => allUrls.push(`${origin}${p}`));

  for (const candidate of allUrls.slice(0, 6)) {
    try {
      const text = await fetchWithTimeout(candidate, 2500);
      if (text && isXmlFeed(text)) {
        return candidate;
      }
    } catch {
      // Ignora e continua testando
    }
  }

  return null;
}

/**
 * Busca na lista de portais conhecidos
 */
export function searchCuratedPortals(query: string): FeedSourceConfig | null {
  const clean = query.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
  const words = clean.split(/\s+/).filter(Boolean);

  // 1. Match exato por id ou keyword (ex: "uol", "g1", "tecmundo", "folha")
  for (const portal of CURATED_PORTALS) {
    if (portal.id === clean || portal.keywords.some(kw => kw === clean)) {
      return {
        id: portal.id,
        name: portal.name,
        url: portal.url,
        category: portal.category,
        region: portal.region,
        brandColor: portal.brandColor,
        enabled: true,
      };
    }
  }

  // 2. Match por domínio exato
  for (const portal of CURATED_PORTALS) {
    try {
      const portalDomain = new URL(portal.url).hostname.replace(/^www\./, '');
      if (portalDomain === clean) {
        return {
          id: portal.id,
          name: portal.name,
          url: portal.url,
          category: portal.category,
          region: portal.region,
          brandColor: portal.brandColor,
          enabled: true,
        };
      }
    } catch {
      // continua
    }
  }

  // 3. Match parcial por palavras
  for (const portal of CURATED_PORTALS) {
    const matchesAllWords = words.length > 0 && words.every(w =>
      portal.name.toLowerCase().includes(w) ||
      portal.keywords.some(kw => kw.includes(w))
    );
    if (matchesAllWords) {
      return {
        id: portal.id,
        name: portal.name,
        url: portal.url,
        category: portal.category,
        region: portal.region,
        brandColor: portal.brandColor,
        enabled: true,
      };
    }
  }

  return null;
}

/**
 * Gera feed oficial do Google News RSS para qualquer tópico ou busca
 */
export function getTopicSearchFeedUrl(topic: string, lang = 'pt-BR', gl = 'BR'): string {
  const query = encodeURIComponent(topic.trim());
  return `https://news.google.com/rss/search?q=${query}&hl=${lang}&gl=${gl}&ceid=${gl}:${lang}`;
}

/**
 * Função principal de Descoberta Inteligente de Feeds
 * - Executada exclusivamente no servidor para evitar problemas de CORS
 * - Suporta: links diretos RSS/Atom, domínios, URLs de páginas HTML, nomes de portais e tópicos livres
 */
export async function discoverFeedFromUrl(input: string): Promise<FeedSourceConfig | null> {
  const query = input?.trim();
  if (!query) return null;

  const isExplicitUrl = /^https?:\/\//i.test(query);
  const isLikelyDirectFeed = isExplicitUrl && (query.includes('.xml') || query.includes('/feed') || query.includes('/rss') || query.includes('atom'));

  // 1. Se o usuário digitou uma URL explícita para um feed direto, testa diretamente antes do portal curado
  if (isLikelyDirectFeed && validateExternalUrl(query).ok) {
    try {
      const res = await fetchWithTimeout(query, 4000);
      if (res && isXmlFeed(res)) {
        return parseFeedInfoFromXml(res, query);
      }
    } catch {
      // continua para os outros métodos
    }
  }

  // 2. Verifica se corresponde a um portal curado imediatamente (ex: "g1", "tecmundo", "folha", etc.)
  const curated = searchCuratedPortals(query);
  if (curated) return curated;

  // 3. Verifica se parece com uma URL ou domínio
  const hasDomainStructure = isExplicitUrl || /\.[a-z]{2,}(\/|$)/i.test(query);

  if (hasDomainStructure) {
    let target = query;
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }

    // Validação de segurança SSRF
    const validation = validateExternalUrl(target);
    if (!validation.ok) return null;

    try {
      // 2.1 Testa o próprio target (pode ser link direto de RSS)
      const initialResponse = await fetchWithTimeout(target, 4000);
      if (initialResponse) {
        if (isXmlFeed(initialResponse)) {
          return parseFeedInfoFromXml(initialResponse, target);
        }

        // 2.2 Se for HTML, procura <link rel="alternate" ...>
        const feedUrlFromHtml = extractFeedLinkFromHtml(initialResponse, target);
        if (feedUrlFromHtml) {
          const feedXml = await fetchWithTimeout(feedUrlFromHtml, 3500);
          if (feedXml && isXmlFeed(feedXml)) {
            return parseFeedInfoFromXml(feedXml, feedUrlFromHtml);
          }
        }
      }

      // 2.3 Testa caminhos comuns (/feed, /rss, /rss.xml, etc.)
      const probedFeedUrl = await probeCommonFeedPaths(target);
      if (probedFeedUrl) {
        const feedXml = await fetchWithTimeout(probedFeedUrl, 3000);
        if (feedXml && isXmlFeed(feedXml)) {
          return parseFeedInfoFromXml(feedXml, probedFeedUrl);
        }
      }
    } catch {
      // Falha de rede para o domínio fornecido
    }
  }

  // 3. Se não tem domínio (ex: digitou "canaltech" ou "cinema"), tenta adicionar extensões comuns (.com.br, .com)
  if (!hasDomainStructure && !query.includes(' ')) {
    const candidates = [`https://${query}.com.br`, `https://${query}.com`];
    for (const cand of candidates) {
      if (validateExternalUrl(cand).ok) {
        try {
          const res = await fetchWithTimeout(cand, 3000);
          if (res) {
            const feedUrl = extractFeedLinkFromHtml(res, cand) || (await probeCommonFeedPaths(cand));
            if (feedUrl) {
              const xml = await fetchWithTimeout(feedUrl, 3000);
              if (xml && isXmlFeed(xml)) {
                return parseFeedInfoFromXml(xml, feedUrl);
              }
            }
          }
        } catch {
          // segue para próximo candidato
        }
      }
    }
  }

  // 4. Fallback Universal: Tópico Google Notícias RSS
  // Garante que qualquer busca válida (ex: "fórmula 1", "astronomia", "notícias de manaus") gere um feed funcional
  try {
    const googleNewsUrl = getTopicSearchFeedUrl(query);
    const googleXml = await fetchWithTimeout(googleNewsUrl, 3500);
    if (googleXml && isXmlFeed(googleXml)) {
      const cleanName = query.charAt(0).toUpperCase() + query.slice(1);
      return {
        id: `topic-${generateCompactHash(query)}`,
        name: cleanName.length > 30 ? cleanName.slice(0, 30) : cleanName,
        url: googleNewsUrl,
        category: 'general',
        region: 'br',
        brandColor: generateBrandColor(query),
        enabled: true,
      };
    }
  } catch {
    // Se até o Google News falhar
  }

  return null;
}
