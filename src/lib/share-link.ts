import type { NewsArticle } from '@/types';
import { siteConfig } from '@/lib/seo-config';

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
      brandColor: data.c || '#333333',
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
      : siteConfig.url;

  // Link curto e elegante com o hash compacto de 8 caracteres do Flippy
  if (article.id && article.id !== '#' && !article.id.startsWith('divider')) {
    return `${origin}/n/${article.id}`;
  }

  const slug = encodeShareSlug(article);
  return `${origin}/s/${slug}`;
}

export interface ShareNotifyOptions {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

/**
 * Compartilha o link direto da notícia com visualização rica (OpenGraph) para WhatsApp,
 * Telegram, redes sociais e navegadores. Instantâneo (0ms de latência), preservando a User Activation.
 */
export async function shareArticle(
  article: NewsArticle,
  onNotify?: (options: ShareNotifyOptions) => void,
  shareSuffix: string = 'Lido no Flippy'
): Promise<boolean> {
  const shareTitle = article.title;
  const shareUrl = getShareUrl(article);
  const shareText = `${article.title}\n\n${shareSuffix}`;

  // 1. Web Share API nativo (dispositivos móveis, iOS Safari, Android Chrome)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
      return true;
    } catch (err: any) {
      if (err?.name === 'AbortError') return true;
      console.warn('Erro ao compartilhar via navigator.share:', err);
    }
  }

  // 2. Fallback moderno: copiar link para a área de transferência
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(shareUrl);
      onNotify?.({
        title: 'Link copiado!',
        description: 'O link com preview da matéria foi copiado para a área de transferência.',
      });
      return true;
    } catch (clipErr) {
      console.warn('Erro ao copiar link:', clipErr);
    }
  }

  // 3. Fallback legado (execCommand)
  try {
    const input = document.createElement('textarea');
    input.value = shareUrl;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    onNotify?.({
      title: 'Link copiado!',
      description: 'O link com preview da matéria foi copiado para a área de transferência.',
    });
    return true;
  } catch (legacyErr) {
    console.error('Falha ao copiar link:', legacyErr);
  }

  onNotify?.({
    title: 'Não foi possível compartilhar',
    description: `Copie o link manualmente: ${shareUrl}`,
    variant: 'destructive',
  });
  return false;
}
