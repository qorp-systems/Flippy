'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import type { FeedSource } from '@/types';
import { Trash2, Search, RotateCw, Eye, EyeOff, Globe2, Sparkles, Laptop, PlusCircle, Check, Languages } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useI18n, type LanguageSetting } from '@/lib/i18n';

export type FeedFilter = 'all' | 'br' | 'world' | 'tech';

const POPULAR_SUGGESTIONS = [
  { name: 'TecMundo', query: 'tecmundo' },
  { name: 'Canaltech', query: 'canaltech' },
  { name: 'Estadão', query: 'estadao' },
  { name: 'InfoMoney', query: 'infomoney' },
  { name: 'Valor Econômico', query: 'valor economico' },
  { name: 'TechCrunch', query: 'techcrunch' },
  { name: 'Wired', query: 'wired' },
  { name: 'Metrópoles', query: 'metropoles' },
];

interface FeedManagerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  feedSources: FeedSource[];
  onFeedSourcesChange: (feedSources: FeedSource[]) => void;
  currentFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  seenCount?: number;
  onClearHistory?: () => void;
}

export default function FeedManager({
  isOpen,
  onOpenChange,
  feedSources,
  onFeedSourcesChange,
  currentFilter,
  onFilterChange,
  onRefresh,
  isRefreshing = false,
  seenCount = 0,
  onClearHistory,
}: FeedManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const { t, lang, setting, setLanguageSetting } = useI18n();

  const handleToggleVisibility = (id: string) => {
    const updated = feedSources.map(f => f.id === id ? { ...f, isHidden: !f.isHidden } : f);
    onFeedSourcesChange(updated);
    const feed = updated.find(f => f.id === id);
    toast({
      title: feed?.isHidden ? t('sourceDisabled') : t('sourceEnabled'),
      description: feed?.name,
    });
    // Atualiza o feed com as fontes ativas
    onRefresh();
  };

  const handleRemoveFeed = (id: string) => {
    onFeedSourcesChange(feedSources.filter(f => f.id !== id));
    toast({ title: t('sourceRemoved') });
    onRefresh();
  };

  const executeDiscover = async (queryText: string) => {
    const targetQuery = queryText.trim();
    if (!targetQuery) return;
    setIsSearching(true);

    try {
      const res = await fetch('/api/feed/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: targetQuery }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.feed) {
        const discovered = data.feed;
        const exists = feedSources.some(
          f => f.url.toLowerCase() === discovered.url.toLowerCase() || f.id === discovered.id
        );

        if (exists) {
          toast({
            title: t('sourceExists'),
            description: t('sourceExistsDesc', { name: discovered.name }),
          });
        } else {
          const newFeed: FeedSource = {
            id: discovered.id,
            name: discovered.name,
            url: discovered.url,
            isHidden: false,
            category: discovered.category,
            region: discovered.region,
            brandColor: discovered.brandColor,
          };

          onFeedSourcesChange([...feedSources, newFeed]);
          toast({
            title: discovered.name,
            description: t('sourceEnabled'),
          });
          setSearchQuery('');
          onRefresh();
        }
      } else {
        toast({
          title: t('searchServiceError'),
          description: data?.error || '',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: t('searchServiceError'),
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleDiscover = () => {
    executeDiscover(searchQuery);
  };

  // Sugestões populares que ainda não foram adicionadas
  const availableSuggestions = POPULAR_SUGGESTIONS.filter(
    s => !feedSources.some(f => f.name.toLowerCase().includes(s.name.toLowerCase()))
  );

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card text-card-foreground w-full sm:max-w-md flex flex-col p-0 border-l border-border/40">
        <SheetHeader className="p-6 border-b border-border/40">
          <SheetTitle className="font-headline text-2xl font-bold flex items-center justify-between">
            {t('preferencesAndFeeds')}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {t('preferencesDesc')}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-grow p-6 space-y-6 overflow-y-auto no-scrollbar">
          {/* Seletor de Idioma da Interface (Detecção Automática ou Manual) */}
          <div className="space-y-2.5 p-3.5 bg-muted/20 border border-border/50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-white" />
                <span className="text-xs font-semibold text-foreground/90">{t('interfaceLanguage')}</span>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase font-medium">
                {setting === 'auto' ? `${t('autoSystemLanguage')} (${lang.toUpperCase()})` : lang.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[
                { id: 'auto', label: 'Auto' },
                { id: 'pt', label: 'PT' },
                { id: 'en', label: 'EN' },
                { id: 'es', label: 'ES' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setLanguageSetting(opt.id as LanguageSetting)}
                  className={`py-1.5 px-2 text-xs font-medium rounded-lg border transition-all ${
                    setting === opt.id
                      ? 'bg-white text-black border-white shadow-sm font-semibold'
                      : 'bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Seletor de Tópico / Região */}
          <div className="space-y-3">
            <h3 className="font-headline text-sm font-semibold text-foreground/90 uppercase tracking-wider">
              {t('feedFocus')}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { onFilterChange('all'); onOpenChange(false); }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                  currentFilter === 'all'
                    ? 'bg-white/15 border-white text-white shadow-sm'
                    : 'bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Sparkles className={`w-4 h-4 ${currentFilter === 'all' ? 'text-white' : 'text-muted-foreground'}`} />
                  {currentFilter === 'all' && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-xs font-semibold">{t('featured')}</span>
                <span className="text-[10px] opacity-75">{t('featuredDesc')}</span>
              </button>

              <button
                onClick={() => { onFilterChange('br'); onOpenChange(false); }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                  currentFilter === 'br'
                    ? 'bg-white/15 border-white text-white shadow-sm'
                    : 'bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">🇧🇷</span>
                  {currentFilter === 'br' && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-xs font-semibold">{t('brazil')}</span>
                <span className="text-[10px] opacity-75">{t('brazilDesc')}</span>
              </button>

              <button
                onClick={() => { onFilterChange('world'); onOpenChange(false); }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                  currentFilter === 'world'
                    ? 'bg-white/15 border-white text-white shadow-sm'
                    : 'bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Globe2 className={`w-4 h-4 ${currentFilter === 'world' ? 'text-white' : 'text-muted-foreground'}`} />
                  {currentFilter === 'world' && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-xs font-semibold">{t('world')}</span>
                <span className="text-[10px] opacity-75">{t('worldDesc')}</span>
              </button>

              <button
                onClick={() => { onFilterChange('tech'); onOpenChange(false); }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                  currentFilter === 'tech'
                    ? 'bg-white/15 border-white text-white shadow-sm'
                    : 'bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Laptop className={`w-4 h-4 ${currentFilter === 'tech' ? 'text-white' : 'text-muted-foreground'}`} />
                  {currentFilter === 'tech' && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-xs font-semibold">{t('tech')}</span>
                <span className="text-[10px] opacity-75">{t('techDesc')}</span>
              </button>
            </div>
          </div>

          {/* Descobrir Novo Feed */}
          <div className="space-y-2.5 p-4 bg-muted/20 border border-border/50 rounded-xl">
            <h3 className="font-headline text-sm font-semibold text-foreground/90 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-white" />
              {t('addPortal')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('addPortalDesc')}
            </p>
            <div className="flex gap-2">
              <Input
                placeholder={t('addPortalPlaceholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleDiscover(); }}
                className="bg-background text-sm h-9"
                disabled={isSearching}
              />
              <Button
                onClick={handleDiscover}
                disabled={isSearching || !searchQuery.trim()}
                size="sm"
                className="h-9 px-3 shrink-0 bg-white text-black hover:bg-white/90"
              >
                {isSearching ? <RotateCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            {/* Chips de Sugestões Rápidas */}
            {availableSuggestions.length > 0 && (
              <div className="pt-1.5">
                <p className="text-[11px] text-muted-foreground/80 mb-1.5">{t('popularSuggestions')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {availableSuggestions.slice(0, 4).map(sug => (
                    <button
                      key={sug.query}
                      onClick={() => executeDiscover(sug.query)}
                      disabled={isSearching}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-muted/50 hover:bg-white/15 border border-border/60 hover:border-white/40 text-foreground/90 transition-colors"
                    >
                      + {sug.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Lista de Fontes Ativas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-sm font-semibold text-foreground/90 uppercase tracking-wider">
                {t('registeredSources')} ({feedSources.filter(f => !f.isHidden).length})
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { onRefresh(); toast({ title: t('reloadingFeed') }); }}
                disabled={isRefreshing}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                {t('reload')}
              </Button>
            </div>

            <div className="space-y-2">
              {feedSources.map(f => (
                <div
                  key={f.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    f.isHidden ? 'bg-muted/10 opacity-50 border-border/20' : 'bg-muted/30 border-border/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: f.brandColor || '#ffffff' }}
                    />
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-foreground truncate">{f.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{f.url}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => handleToggleVisibility(f.id)}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title={f.isHidden ? t('activateSource') : t('deactivateSource')}
                    >
                      {f.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-white" />}
                    </button>
                    <button
                      onClick={() => handleRemoveFeed(f.id)}
                      className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                      title={t('removeSource')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Histórico de Notícias Lidas */}
          <div className="pt-3 border-t border-border/40 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-foreground">{t('readingHistory')}</p>
              <p className="text-[11px] text-muted-foreground">{t('markedAsRead', { count: seenCount })}</p>
            </div>
            {seenCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClearHistory?.();
                  toast({ title: t('historyResetTitle'), description: t('historyResetDesc') });
                }}
                className="text-xs h-7 px-2.5 border-border/60"
              >
                {t('clearHistory')}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
