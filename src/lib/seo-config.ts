export const siteConfig = {
  name: 'Flippy',
  shortName: 'Flippy',
  title: 'Flippy - Notícias Rápidas em Formato Stories & Shorts',
  titleTemplate: '%s | Flippy',
  description:
    'Acompanhe as principais notícias do Brasil e do mundo em formato dinâmico de stories e shorts. Notícias em tempo real com imagens marcantes e resumos diretos ao ponto.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://flippy.news',
  locale: 'pt_BR',
  keywords: [
    'notícias',
    'flippy',
    'notícias rápidas',
    'stories de notícias',
    'shorts notícias',
    'feed de notícias',
    'brasil',
    'mundo',
    'tecnologia',
    'economia',
    'notícias em tempo real',
    'mobile news',
    'news swipe',
    'agregador de notícias',
  ],
  authors: [
    {
      name: 'Flippy News Team',
      url: process.env.NEXT_PUBLIC_SITE_URL || 'https://flippy.news',
    },
  ],
  creator: 'Flippy',
  publisher: 'Flippy News',
  themeColor: '#000000',
  category: 'news',
};

export type SiteConfig = typeof siteConfig;
