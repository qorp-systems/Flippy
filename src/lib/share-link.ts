import type { NewsArticle } from '@/types';

interface SharePayload {
  i?: string; // id
  t: string;  // title
  d?: string; // description
  m?: string; // imageUrl
  s?: string; // sourceName
  u?: string; // originalUrl
  c?: string; // brandColor
}

function toBase64Url(str: string): string {
  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(str, 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }
  } catch {}

  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }

  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(base64, 'base64').toString('utf8');
    }
  } catch {}

  return decodeURIComponent(escape(atob(base64)));
}

/**
 * Codifica os dados essenciais de uma matéria em um slug URL-safe compacto,
 * permitindo gerar links dinâmicos sem necessidade de banco de dados.
 */
export function encodeShareSlug(article: Partial<NewsArticle>): string {
  const payload: SharePayload = {
    i: article.id,
    t: article.title || '',
    d: (article.summary || article.description || '').slice(0, 200),
    m: article.imageUrl || '',
    s: article.sourceName || '',
    u: article.originalUrl || '',
    c: article.brandColor || '',
  };
  return toBase64Url(JSON.stringify(payload));
}

/**
 * Decodifica o slug para restaurar os dados da matéria.
 */
export function decodeShareSlug(slug: string): Partial<NewsArticle> | null {
  try {
    const raw = fromBase64Url(slug);
    const data: SharePayload = JSON.parse(raw);
    if (!data.t) return null;

    return {
      id: data.i || 'shared-article',
      title: data.t,
      description: data.d || '',
      summary: data.d || '',
      imageUrl: data.m || '',
      sourceName: data.s || 'Flippy',
      originalUrl: data.u || '#',
      brandColor: data.c || '#29ABE2',
    };
  } catch (err) {
    console.error('Falha ao decodificar slug de compartilhamento:', err);
    return null;
  }
}

/**
 * Retorna a URL completa de compartilhamento dinâmico.
 * Em desenvolvimento ou rede local (192.168.x.x / localhost), utiliza o domínio público
 * para que os robôs do WhatsApp/redes sociais consigam carregar a prévia e metatags.
 */
export function getShareUrl(article: Partial<NewsArticle>): string {
  const isLocalHost =
    typeof window !== 'undefined' &&
    window.location.origin &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.startsWith('192.168.') ||
      window.location.hostname.startsWith('10.') ||
      window.location.hostname.startsWith('172.'));

  const origin =
    typeof window !== 'undefined' && window.location.origin && !isLocalHost
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.flippy.news');

  // Link curto e elegante com o hash compacto de 8 caracteres do Flippy
  if (article.id && article.id !== '#' && !article.id.startsWith('divider')) {
    return `${origin}/n/${article.id}`;
  }

  const slug = encodeShareSlug(article);
  return `${origin}/s/${slug}`;
}
