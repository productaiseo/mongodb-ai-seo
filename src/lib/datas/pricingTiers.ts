export interface PricingTier {
  id: string;
  name: string;
  price: number;
  displayPrice: string;
  features: string[];
  popular?: boolean;
  description: string;
}


export const pricingTiers: PricingTier[] = [
  {
    id: 'basic',
    name: 'Temel Paket',
    price: 500, // 5.00 TL (in kuruş)
    displayPrice: '5',
    description: 'Küçük işletmeler için ideal başlangıç paketi',
    features: [
      'Tüm AI platformunda görünürlük',
      'Aylık performans raporu',
      'Temel GEO optimizasyonu',
      'Email destek',
      '1 web sitesi'
    ]
  },
  {
    id: 'professional',
    name: 'Profesyonel Paket',
    price: 700, // 7.00 TL (in kuruş)
    displayPrice: '7',
    description: 'Büyüyen işletmeler için gelişmiş özellikler',
    popular: true,
    features: [
      'Tüm AI platformunda görünürlük',
      'Haftalık performans raporu',
      'Gelişmiş GEO optimizasyonu',
      'Öncelikli destek',
      '3 web sitesi',
      'Rakip analizi',
      'AI citation tracking'
    ]
  },
  {
    id: 'enterprise',
    name: 'Kurumsal Paket',
    price: 800, // 8.00 TL (in kuruş)
    displayPrice: '8',
    description: 'Büyük ölçekli kurumlar için kapsamlı çözüm',
    features: [
      'Tüm AI platformlarında görünürlük',
      'Günlük performans raporu',
      'Özel GEO stratejisi',
      '7/24 öncelikli destek',
      'Sınırsız web sitesi',
      'Detaylı rakip analizi',
      'Özel AI model entegrasyonu',
    ]
  }
];