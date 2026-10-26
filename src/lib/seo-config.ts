export const siteConfig = {
  name: 'Flippy',
  shortName: 'Flippy',
  title: 'Flippy - Notícias Rápidas em Formato Visual',
  titleTemplate: '%s | Flippy',
  description:
    'Acompanhe as principais notícias do Brasil e do mundo em um feed visual dinâmico, rápido e direto ao ponto. Deslize para ler as novidades em tempo real.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://flippy.news',
  locale: 'pt_BR',
  keywords: [
    'notícias',
    'flippy',
    'notícias rápidas',
    'feed visual',
    'notícias em tempo real',
    'feed de notícias',
    'brasil',
    'mundo',
    'tecnologia',
    'economia',
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
