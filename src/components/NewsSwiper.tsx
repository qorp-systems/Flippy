'use client';

import type { NewsArticle } from '@/types';
import NewsItem from './NewsItem';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronUp } from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';
import { cn } from '@/lib/utils';

const SWIPE_THRESHOLD = 0.12;    // 12% da altura da tela (super responsivo)
const VELOCITY_THRESHOLD = 0.18; // px/ms — flick leve já passa de notícia
const RUBBER_FACTOR = 0.18;      // resistência nas bordas (efeito elástico agradável)
const SNAP_EASING = 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)';
const SNAP_DURATION_MS = 290;
const LOAD_MORE_THRESHOLD = 5;

interface NewsSwiperProps {
  articles: NewsArticle[];
  seenArticleIds: string[];
  setSeenArticleIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  onOpenFeedManager: () => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

export default function NewsSwiper({
  articles,
  seenArticleIds,
  setSeenArticleIds,
  onOpenFeedManager,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: NewsSwiperProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasSwiped, setHasSwiped] = useState(false);
  const activeIndexRef = useRef(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isTransitioning = useRef(false);
  const transitionTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const touchStartTime = useRef(0);
  const loadMoreTriggered = useRef(false);
  const activatedAt = useRef(Date.now());
  const prevIndexRef = useRef(0);
  const { trackDwell, trackClick } = usePreferences();

  // Esconde o indicador ao avançar de slide ou após 6 segundos
  useEffect(() => {
    if (activeIndex > 0) {
      setHasSwiped(true);
    }
  }, [activeIndex]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasSwiped(true);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  // Pre-fetch inteligente das próximas imagens (UX fluida estilo Stories/TikTok)
  useEffect(() => {
    const nextArticles = [
      articles[activeIndex + 1],
      articles[activeIndex + 2],
    ].filter(Boolean);

    nextArticles.forEach(item => {
      if (item?.imageUrl && !item.imageUrl.includes('placehold.co')) {
        const img = new Image();
        img.src = item.imageUrl;
      }
    });
  }, [activeIndex, articles]);

  const showLoader = isLoadingMore || hasMore;
  const totalSlidesRef = useRef(0);
  totalSlidesRef.current = articles.length + (showLoader ? 1 : 0);

  const getVH = () => viewportRef.current?.clientHeight ?? window.innerHeight;

  const applyTransform = useCallback((extraOffset = 0, animated = false) => {
    if (!wrapperRef.current) return;
    const y = -activeIndexRef.current * getVH() + extraOffset;
    wrapperRef.current.style.transition = animated ? SNAP_EASING : 'none';
    wrapperRef.current.style.transform = `translate3d(0, ${y}px, 0)`;
  }, []);

  const goToIndex = useCallback((newIndex: number) => {
    const clamped = Math.max(0, Math.min(newIndex, totalSlidesRef.current - 1));
    isTransitioning.current = true;
    activeIndexRef.current = clamped;
    setActiveIndex(clamped);
    applyTransform(0, true);

    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(() => {
      isTransitioning.current = false;
    }, SNAP_DURATION_MS);
  }, [applyTransform]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Permite interrupção imediata ao tocar de novo (elimina a sensação de travado)
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    isTransitioning.current = false;
    if (wrapperRef.current) wrapperRef.current.style.transition = 'none';

    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY;
    const rawDelta = touchCurrentY.current - touchStartY.current;

    if (rawDelta < -10) {
      setHasSwiped(true);
    }

    let delta = rawDelta;

    // Resistência suave nas bordas (efeito elástico)
    const atTop = activeIndexRef.current === 0;
    const atBottom = activeIndexRef.current >= totalSlidesRef.current - 1;
    if ((atTop && delta > 0) || (atBottom && delta < 0)) {
      delta *= RUBBER_FACTOR;
    }

    applyTransform(delta, false);
  }, [applyTransform]);

  const handleTouchEnd = useCallback(() => {
    const delta = touchCurrentY.current - touchStartY.current;
    const elapsed = Math.max(Date.now() - touchStartTime.current, 1);
    const velocity = Math.abs(delta) / elapsed;
    const vh = getVH();
    const swipedEnough = Math.abs(delta) > vh * SWIPE_THRESHOLD;
    const fastEnough = velocity > VELOCITY_THRESHOLD;

    // Sempre avança apenas 1 slide por gesto com resposta imediata
    if (delta < 0 && (swipedEnough || fastEnough)) {
      goToIndex(activeIndexRef.current + 1);
    } else if (delta > 0 && (swipedEnough || fastEnough)) {
      goToIndex(activeIndexRef.current - 1);
    } else {
      applyTransform(0, true); // snap de volta com animação suave
    }
  }, [applyTransform, goToIndex]);

  // Resync transform quando artigos mudam
  useEffect(() => {
    applyTransform(0, false);
  }, [articles, applyTransform]);

  // Blindagem ao alternar abas ou redimensionar (volta sem bug de alinhamento)
  useEffect(() => {
    const handleRealign = () => {
      if (document.hidden) return;
      isTransitioning.current = false;
      applyTransform(0, false);
    };

    window.addEventListener('resize', handleRealign, { passive: true });
    window.addEventListener('orientationchange', handleRealign, { passive: true });
    document.addEventListener('visibilitychange', handleRealign);

    return () => {
      window.removeEventListener('resize', handleRealign);
      window.removeEventListener('orientationchange', handleRealign);
      document.removeEventListener('visibilitychange', handleRealign);
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    };
  }, [applyTransform]);

  // Load more
  useEffect(() => {
    const dist = articles.length - 1 - activeIndex;
    if (dist <= LOAD_MORE_THRESHOLD && hasMore && !isLoadingMore && !loadMoreTriggered.current) {
      loadMoreTriggered.current = true;
      onLoadMore();
    }
    if (dist > LOAD_MORE_THRESHOLD) loadMoreTriggered.current = false;
  }, [activeIndex, articles.length, hasMore, isLoadingMore, onLoadMore]);

  // Dwell time
  useEffect(() => {
    const now = Date.now();
    const dwell = now - activatedAt.current;
    if (prevIndexRef.current !== activeIndex && articles[prevIndexRef.current]) {
      trackDwell(articles[prevIndexRef.current], dwell);
    }
    prevIndexRef.current = activeIndex;
    activatedAt.current = now;
  }, [activeIndex]);

  // Marcar como visto (com debounce de 1.5s de permanência na notícia)
  useEffect(() => {
    const article = articles[activeIndex];
    if (!article || article.isDivider) return;

    const timer = setTimeout(() => {
      setSeenArticleIds(prev => {
        if (prev.includes(article.id)) return prev;
        return [...prev, article.id];
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [activeIndex, articles, setSeenArticleIds]);

  // Navegação por roda do mouse no desktop / notebook
  useEffect(() => {
    let lastWheelTime = 0;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 30) return;
      setHasSwiped(true);
      const now = Date.now();
      if (now - lastWheelTime < 480) return; // Debounce de transição
      lastWheelTime = now;

      if (e.deltaY > 0) {
        goToIndex(activeIndexRef.current + 1);
      } else {
        goToIndex(activeIndexRef.current - 1);
      }
    };

    const vp = viewportRef.current;
    if (vp) {
      vp.addEventListener('wheel', onWheel, { passive: true });
    }
    return () => {
      if (vp) vp.removeEventListener('wheel', onWheel);
    };
  }, [goToIndex]);

  // Navegação por teclado
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        setHasSwiped(true);
        goToIndex(activeIndexRef.current + 1);
      }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        setHasSwiped(true);
        goToIndex(activeIndexRef.current - 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goToIndex]);

  if (articles.length === 0) {
    return (
      <div className="flex items-center justify-center h-[100dvh] w-screen bg-background text-foreground p-4 text-center">
        <div className="bg-card p-6 rounded-lg shadow-xl">
          <p className="font-headline text-xl mb-2">Nenhuma Notícia no Feed</p>
          <p className="text-muted-foreground">O feed selecionado está vazio ou não retornou notícias.</p>
          <Button onClick={onOpenFeedManager} className="mt-4">Gerenciar Feeds</Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={viewportRef}
      className="relative h-[100dvh] w-screen overflow-hidden touch-none select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        ref={wrapperRef}
        className="flex flex-col w-full h-full"
        style={{ willChange: 'transform' }}
      >
        {articles.map((article, index) => {
          // Virtualização da janela de visualização: apenas cards adjacentes (+-2) montam DOM pesado e imagens
          const isNear = Math.abs(index - activeIndex) <= 2;
          return (
            <div key={article.id} className="h-[100dvh] w-screen flex-shrink-0">
              {isNear ? (
                <NewsItem
                  article={article}
                  isActive={index === activeIndex}
                  shouldFetchSummary={index === activeIndex + 1}
                  onArticleClick={trackClick}
                />
              ) : (
                <div className="w-full h-full bg-background" />
              )}
            </div>
          );
        })}

        {showLoader && (
          <div className="h-[100dvh] w-screen flex-shrink-0 flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Carregando mais notícias...</p>
            </div>
          </div>
        )}
      </div>

      {/* Indicador discreto de arrastar para cima ao abrir o app */}
      <div
        className={cn(
          'absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center justify-center transition-all duration-700 ease-out select-none',
          hasSwiped || activeIndex > 0
            ? 'opacity-0 translate-y-3 pointer-events-none'
            : 'opacity-75'
        )}
        aria-hidden="true"
      >
        <ChevronUp className="w-6 h-6 text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-bounce" />
      </div>
    </div>
  );
}
