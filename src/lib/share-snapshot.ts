import { toBlob } from 'html-to-image';
import type { NewsArticle } from '@/types';
import { getShareUrl } from '@/lib/share-link';

interface NotifyOptions {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

/**
 * Gera o Blob da snapshot de um card de forma isolada.
 */
export async function generateCardBlob(cardElement: HTMLElement): Promise<Blob | null> {
  const width = cardElement.offsetWidth || window.innerWidth;
  const height = cardElement.offsetHeight || window.innerHeight;

  return await toBlob(cardElement, {
    width,
    height,
    canvasWidth: Math.min(width * 2, 1600),
    canvasHeight: Math.min(height * 2, 2800),
    pixelRatio: 2,
    skipFonts: true,
    cacheBust: false,
    imagePlaceholder:
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    filter: (node) => {
      if (node instanceof HTMLElement && node.dataset.noSnapshot === 'true') {
        return false;
      }
      return true;
    },
  });
}

/**
 * Dispara o compartilhamento respeitando rigorosamente a janela de ativação de gesto do usuário
 * (User Activation / User Gesture), garantindo que o navegador nunca bloqueie o navigator.share.
 */
export async function shareArticle(
  cardElement: HTMLElement | null,
  article: NewsArticle,
  cachedBlob: Blob | null,
  onNotify?: (options: NotifyOptions) => void
): Promise<boolean> {
  const shareTitle = article.title;
  const shareUrl = getShareUrl(article);
  const shareText = `${article.title}\n\nLido no Flippy`;

  const cleanSource = (article.sourceName || 'flippy')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
  const fileName = `flippy-${cleanSource}-${article.id.slice(0, 8)}.png`;

  // 1. Se houver blob pré-gerado em cache e o navegador suportar arquivo (ex: HTTPS / PWA)
  // Chamada síncrona/imediata preserva a User Activation
  if (cachedBlob && typeof navigator !== 'undefined' && navigator.canShare) {
    try {
      const file = new File([cachedBlob], fileName, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
        });
        return true;
      }
    } catch (shareErr: any) {
      if (shareErr?.name === 'AbortError') return true;
      console.warn('Erro ao compartilhar arquivo pré-gerado, tentando link:', shareErr);
    }
  }

  // 2. Se não houver blob ou em ambiente HTTP (ex: 192.168.x.x onde compartilhamento de arquivo é restrito)
  // Compartilha imediatamente o link dinâmico do Flippy (0ms de latência, User Activation 100% válida)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
      return true;
    } catch (shareErr: any) {
      if (shareErr?.name === 'AbortError') return true;
      console.warn('Erro ao compartilhar link via Web Share:', shareErr);
    }
  }

  // 3. Fallback para desktop ou navegadores sem Web Share API
  let blob = cachedBlob;
  if (!blob && cardElement) {
    try {
      blob = await generateCardBlob(cardElement);
    } catch {
      // segue para a cópia do link
    }
  }

  if (blob) {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard && shareUrl) {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // silencioso
    }
  }

  onNotify?.({
    title: 'Link copiado!',
    description: blob
      ? 'A imagem foi salva e o link do Flippy foi copiado.'
      : 'O link da matéria no Flippy foi copiado para a área de transferência.',
  });
  return true;
}
