import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { decodeShareSlug } from '@/lib/share-link';
import FlippyLogo from '@/components/FlippyLogo';
import { Button } from '@/components/ui/button';
import { ExternalLink, Compass, Newspaper } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = decodeShareSlug(slug);

  if (!article || !article.title) {
    return {
      title: 'Notícia não encontrada | Flippy',
      description: 'Esta notícia compartilhada não foi encontrada ou o link é inválido.',
    };
  }

  const title = article.title;
  const description = article.summary || article.description || 'Leia as notícias mais recentes no Flippy.';
  const images = article.imageUrl ? [{ url: article.imageUrl, width: 1200, height: 630, alt: title }] : [];

  return {
    title: `${title} | Flippy`,
    description,
    openGraph: {
      title,
      description,
      siteName: 'Flippy',
      locale: 'pt_BR',
      type: 'article',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: article.imageUrl ? [article.imageUrl] : [],
    },
  };
}

export default async function SharedArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = decodeShareSlug(slug);

  if (!article || !article.title) {
    notFound();
  }

  const brandColor = article.brandColor || '#333333';
  const hasImage = Boolean(article.imageUrl && !article.imageUrl.includes('placehold.co'));

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

      {/* Conteúdo da Notícia Compartilhada */}
      <div className="relative z-10 px-4 pb-8 sm:px-6 md:px-8 text-foreground max-w-2xl">
        <div className="mb-3">
          {article.sourceName && (
            <span
              className="font-body text-xs font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-sm text-white shadow-sm inline-block whitespace-nowrap"
              style={{
                backgroundColor: brandColor,
              }}
            >
              {article.sourceName}
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
