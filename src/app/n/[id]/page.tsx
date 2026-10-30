import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticleById } from '@/lib/news-engine/engine';
import { siteConfig } from '@/lib/seo-config';
import FlippyLogo from '@/components/FlippyLogo';
import { Button } from '@/components/ui/button';
import { ExternalLink, Compass, Newspaper, AlertCircle } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticleById(id);

  if (!article) {
    return {
      title: 'Notícia | Flippy',
      description: 'Leia as principais notícias no Flippy.',
      openGraph: {
        title: 'Flippy - Notícias Rápidas em Formato Visual',
        description: 'Acompanhe as principais notícias em tempo real no Flippy.',
        siteName: 'Flippy',
        images: [`${siteConfig.url}/og-image.png`],
      },
    };
  }

  const title = article.title;
  const description = article.summary || article.description || 'Leia no Flippy.';
  const fallbackImage = `${siteConfig.url}/og-image.png`;
  const imageUrl =
    article.imageUrl && !article.imageUrl.includes('placehold.co')
      ? article.imageUrl
      : fallbackImage;

  const images = [{ url: imageUrl, width: 1200, height: 630, alt: title }];

  return {
    title: `${title} | Flippy`,
    description,
    openGraph: {
      title,
      description,
      siteName: 'Flippy',
      locale: 'pt_BR',
      type: 'article',
      url: `${siteConfig.url}/n/${id}`,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ShortArticlePage({ params }: Props) {
  const { id } = await params;
  const article = await getArticleById(id);

  if (!article) {
    return (
      <main className="relative h-[100dvh] w-screen overflow-hidden bg-background text-foreground flex flex-col justify-between p-6">
        <header className="relative z-10 flex justify-between items-center">
          <Link href="/" className="inline-block transition-transform active:scale-95">
            <FlippyLogo />
          </Link>
        </header>

        <div className="relative z-10 max-w-md mx-auto text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-headline text-2xl font-bold mb-2 text-white">
            Notícia não encontrada
          </h1>
          <p className="font-body text-sm text-white/70 mb-6">
            Esta matéria pode ter expirado ou o link está desatualizado. Acesse o Flippy para ver as novidades mais recentes.
          </p>
          <Link href="/">
            <Button className="font-body font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg">
              <Compass className="mr-2 h-4 w-4" />
              Explorar notícias recentes
            </Button>
          </Link>
        </div>

        <div className="h-6" />
      </main>
    );
  }

  const brandColor = article.brandColor || article.source?.brandColor || '#333333';
  const hasImage = Boolean(article.imageUrl && !article.imageUrl.includes('placehold.co'));
  const sourceName = article.sourceName || article.source?.name || 'Flippy';

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-background text-foreground flex flex-col justify-between">
      {/* Background de Imagem ou Fallback Editorial */}
      {hasImage ? (
        <img
          src={article.imageUrl}
          alt={article.title}
          className="absolute inset-0 w-full h-full object-cover select-none"
        />
      ) : (
        <div
          className="absolute inset-0 w-full h-full flex flex-col justify-center items-center select-none"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, ${brandColor}33 0%, #0d1117 75%)`,
          }}
        >
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

      {/* Degradê editorial sobre a imagem */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/25 pointer-events-none" />

      {/* Top Header com Flippy Logo e botão para o App */}
      <header className="relative z-10 p-4 flex justify-between items-center">
        <Link href="/" className="inline-block transition-transform active:scale-95">
          <FlippyLogo />
        </Link>

        <Link href="/">
          <Button
            size="sm"
            variant="outline"
            className="font-body text-xs border-white/20 bg-black/40 hover:bg-black/60 text-white rounded-full shadow-md"
          >
            <Compass className="mr-1.5 h-3.5 w-3.5 text-primary" />
            Explorar Flippy
          </Button>
        </Link>
      </header>

      {/* Conteúdo da Notícia */}
      <div className="relative z-10 px-4 pb-8 sm:px-6 md:px-8 text-foreground max-w-2xl">
        <div className="mb-3 flex items-center gap-2">
          {sourceName && (
            <span
              className="font-body text-xs font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-sm text-white shadow-sm inline-block whitespace-nowrap"
              style={{
                backgroundColor: brandColor,
              }}
            >
              {sourceName}
            </span>
          )}

          {article.relativeTime && (
            <span className="text-xs text-white/70 font-body">
              • {article.relativeTime}
            </span>
          )}
        </div>

        <h1
          className="font-headline text-2xl sm:text-3xl font-bold mb-3 text-white leading-tight"
          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
        >
          {article.title}
        </h1>

        <p
          className="font-body text-sm sm:text-base text-white/90 whitespace-pre-line leading-relaxed mb-6 line-clamp-6"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}
        >
          {article.summary || article.description}
        </p>

        {/* Botões de Ação */}
        <div className="flex items-center gap-3 flex-wrap">
          {article.originalUrl && article.originalUrl !== '#' && (
            <a
              href={article.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[140px]"
            >
              <Button
                className="w-full font-body font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg active:scale-95 transition-transform"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ler matéria completa
              </Button>
            </a>
          )}

          <Link href="/" className="flex-1 min-w-[140px]">
            <Button
              variant="outline"
              className="w-full font-body font-medium border-white/20 bg-black/50 hover:bg-black/70 text-white active:scale-95 transition-transform"
            >
              <Compass className="mr-2 h-4 w-4 text-primary" />
              Ver mais no Flippy
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
