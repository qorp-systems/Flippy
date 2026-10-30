import type { Metadata } from 'next';
import { getArticleById } from '@/lib/news-engine/engine';
import { siteConfig } from '@/lib/seo-config';
import ShortArticleView from './ShortArticleView';

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

  return <ShortArticleView article={article} />;
}
