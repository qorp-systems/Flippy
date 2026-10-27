'use client';

import type { NewsArticle } from '@/types';
import { Button } from '@/components/ui/button';
import { Send, Loader2, ChevronDown, CheckCircle2, Newspaper } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import FlippyLogo from '@/components/FlippyLogo';
import { shareArticle, generateCardBlob } from '@/lib/share-snapshot';
import { useToast } from '@/hooks/use-toast';

interface NewsItemProps {
  article: NewsArticle;
  isActive: boolean;
  shouldFetchSummary?: boolean;
  onArticleClick?: (article: NewsArticle) => void;
}

export default function NewsItem({ article, isActive, onArticleClick }: NewsItemProps) {
  const [imageError, setImageError] = useState(false);
  const [useDirectImage, setUseDirectImage] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const cachedBlobRef = useRef<Blob | null>(null);
  const { toast } = useToast();

  // Reseta estado ao trocar de matéria
  useEffect(() => {
    setImageError(false);
    setUseDirectImage(false);
    setImageLoaded(false);
    setIsSharing(false);
    cachedBlobRef.current = null;
  }, [article.id]);

  // Pré-renderiza a snapshot em background assim que a imagem correspondente ao post carregar
  useEffect(() => {
    if (!isActive || article.isDivider) return;

    // Se o artigo possui imagem, aguarda o onLoad da imagem real antes de gerar o blob
    const hasImagePending = Boolean(article.imageUrl && !imageError && !imageLoaded);
    if (hasImagePending) return;

    const timer = setTimeout(async () => {
      if (!cardRef.current) return;
      try {
        const b = await generateCardBlob(cardRef.current);
        cachedBlobRef.current = b;
      } catch {
        // silencioso
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isActive, article.id, article.isDivider, imageLoaded, imageError]);

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      await shareArticle(cardRef.current, article, cachedBlobRef.current, (opts) => {
        toast({
          title: opts.title,
          description: opts.description,
          variant: opts.variant,
        });
      });
    } catch (error) {
      console.error('Erro ao acionar compartilhamento:', error);
    } finally {
      setIsSharing(false);
    }
  };

  // Se for o card divisor de transição
  if (article.isDivider) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#121212] via-[#161c28] to-[#121212] text-center">
        <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mb-6 shadow-lg shadow-primary/10">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>

        <h2 className="font-headline text-2xl sm:text-3xl font-bold mb-3 text-white max-w-sm">
          {article.title}
        </h2>

        <p className="font-body text-sm sm:text-base text-white/70 max-w-xs mb-8 leading-relaxed">
          {article.description}
        </p>

        <div className="flex flex-col items-center gap-2 animate-bounce opacity-80">
          <span className="text-xs text-white/60 font-body">Deslize para continuar</span>
          <ChevronDown className="w-5 h-5 text-primary" />
        </div>
      </div>
    );
  }

  const displayText = article.summary || article.description || '';
  const isAi = !!article.isAiSummary;
  const brandColor = article.brandColor || article.source?.brandColor || '#29ABE2';

  const lastOpenTimeRef = useRef(0);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const handleOpen = () => {
    if (!article.originalUrl || article.originalUrl === '#') return;
    const now = Date.now();
    if (now - lastOpenTimeRef.current < 450) return; // Debounce anti duplo disparo
    lastOpenTimeRef.current = now;

    onArticleClick?.(article);
    window.open(article.originalUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartPos.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const t = e.changedTouches[0];
    const dx = Math.abs(t.clientX - touchStartPos.current.x);
    const dy = Math.abs(t.clientY - touchStartPos.current.y);
    touchStartPos.current = null;

    // Se moveu mais de 16px, foi gesto de swipe e não toque
    if (dx > 16 || dy > 16) return;

    // Toque rápido e limpo: abre imediatamente com 0ms de delay
    handleOpen();
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleOpen();
  };

  const hasValidImage = Boolean(article.imageUrl && !imageError);
  const proxiedImageUrl =
    article.imageUrl && !article.imageUrl.startsWith('/') && !article.imageUrl.startsWith('data:')
      ? `/api/proxy-image?url=${encodeURIComponent(article.imageUrl)}`
      : article.imageUrl;
  const currentImageSrc = useDirectImage ? article.imageUrl : proxiedImageUrl;

  return (
    <div ref={cardRef} className="relative w-full h-full overflow-hidden bg-background">
      {/* Top Branding Flippy no card (visível apenas na snapshot gerada) */}
      <div data-snapshot-logo className="absolute top-4 left-4 z-10 select-none pointer-events-none hidden">
        <FlippyLogo />
      </div>

      {/* Imagem Real de Alta Resolução ou Fallback Editorial Nativo (Sem placehold.co) */}
      {hasValidImage ? (
        <img
          src={currentImageSrc}
          alt={article.title}
          loading="eager"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover select-none"
          data-ai-hint={article.imageAiHint || 'news background'}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            if (!useDirectImage && article.imageUrl) {
              setUseDirectImage(true);
            } else {
              setImageError(true);
            }
          }}
        />
      ) : (
        <div
          className="absolute inset-0 w-full h-full flex flex-col justify-center items-center select-none"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, ${brandColor}33 0%, #0d1117 75%)`,
          }}
        >
          {/* Padrão editorial geométrico sutil */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:28px_28px]" />
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center border shadow-2xl backdrop-blur-md mb-24 opacity-80"
            style={{
              backgroundColor: `${brandColor}22`,
              borderColor: `${brandColor}44`,
            }}
          >
            <Newspaper className="w-10 h-10" style={{ color: brandColor }} />
          </div>
        </div>
      )}

      {/* Gradiente em duas camadas: escurece o fundo sem degradar a imagem */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10 pointer-events-none" />

      <div className="absolute bottom-0 left-0 right-0 pt-4 px-4 pb-20 sm:pt-6 sm:px-6 sm:pb-20 md:pt-8 md:px-8 md:pb-24 text-foreground">
        <div
          onClick={handleClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={
            article.originalUrl && article.originalUrl !== '#'
              ? 'cursor-pointer select-none transition-opacity active:opacity-80 focus:outline-none'
              : ''
          }
          role={article.originalUrl && article.originalUrl !== '#' ? 'button' : undefined}
          tabIndex={article.originalUrl && article.originalUrl !== '#' ? 0 : undefined}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleOpen();
            }
          }}
        >
          <h2
            className="font-headline text-2xl sm:text-3xl font-bold mb-2 sm:mb-3"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
          >
            {article.title}
          </h2>

          <div className="min-h-[4rem] mb-3 sm:mb-4">
            <p
              className="font-body text-sm sm:text-base md:text-lg text-white/90 whitespace-pre-line leading-relaxed line-clamp-5"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}
            >
              {displayText || 'Conteúdo não disponível.'}
            </p>
          </div>
        </div>

        <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {article.sourceName && (
                <span
                  className="font-body text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm text-white shadow-sm whitespace-nowrap inline-flex items-center shrink-0"
                  style={{
                    backgroundColor: brandColor,
                  }}
                >
                  {article.sourceName}
                </span>
              )}

              {article.dayBucket && article.dayBucket !== 'today' && (
                <span className="font-body text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded bg-white/20 text-white/90 backdrop-blur-sm whitespace-nowrap shrink-0">
                  {article.dayBucket === 'yesterday' ? 'Ontem' : 'Anterior'}
                </span>
              )}

              {article.relativeTime && (
                <span className="text-xs text-white/70 font-body whitespace-nowrap shrink-0">
                  • {article.relativeTime}
                </span>
              )}
            </div>

            {article.relatedSources && article.relatedSources.length > 0 && (
              <p className="text-[11px] text-white/60 truncate">
                Também coberto por: {article.relatedSources.map(s => s.name).join(', ')}
              </p>
            )}

            {isAi && (
              <p className="text-xs text-muted-foreground italic mb-0.5">Resumido por IA</p>
            )}
          </div>

          <Button
            data-no-snapshot="true"
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            disabled={isSharing}
            variant="outline"
            size="sm"
            className="font-body shrink-0 h-8 px-2.5 text-xs border-white/20 bg-black/40 hover:bg-black/60 text-white transition-all active:scale-95 shadow-md"
            aria-label="Compartilhar matéria"
          >
            {isSharing ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Compartilhar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
