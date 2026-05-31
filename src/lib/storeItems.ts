export interface StoreItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  pointsCost: number;
  category: 'food' | 'discount' | 'premium' | 'special';
  badge?: string;
  stock?: number;
}

export const STORE_ITEMS: StoreItem[] = [
  {
    id: 'free_coffee',
    title: 'Ücretsiz Kahve',
    description: 'Partner kafelerden 1 adet filtre kahve. QR kod ile kullanılabilir.',
    icon: '☕',
    pointsCost: 300,
    category: 'food',
    badge: 'Popüler',
  },
  {
    id: 'discount_10',
    title: '%10 İndirim Kuponu',
    description: 'Herhangi bir partner işletmede %10 indirim kuponu.',
    icon: '🎟️',
    pointsCost: 150,
    category: 'discount',
  },
  {
    id: 'free_dessert',
    title: 'Ücretsiz Tatlı',
    description: 'Partner restoranlarda 1 porsiyon tatlı. Min. 150₺ alışveriş ile.',
    icon: '🍰',
    pointsCost: 250,
    category: 'food',
  },
  {
    id: 'premium_week',
    title: '1 Hafta Premium',
    description: 'Özel rozet, görev ipuçları + liderboard vurgulama.',
    icon: '⭐',
    pointsCost: 500,
    category: 'premium',
    badge: 'Yeni',
  },
  {
    id: 'hint_pack',
    title: '5x İpucu Paketi',
    description: 'Zor görevlerde ekstra ipucu hakkı. Dilediğin zaman kullan.',
    icon: '💡',
    pointsCost: 200,
    category: 'special',
  },
  {
    id: 'double_points',
    title: '2x Puan Günü',
    description: '24 saat boyunca kazandığın tüm puanlar 2 katına çıkar.',
    icon: '⚡',
    pointsCost: 400,
    category: 'special',
    badge: 'Güçlü',
  },
  {
    id: 'free_meal',
    title: 'Ücretsiz Öğün',
    description: 'Seçili restoranlarda 1 ana yemek. Min. 2 kişilik masa ile.',
    icon: '🍽️',
    pointsCost: 750,
    category: 'food',
    badge: 'Değerli',
  },
  {
    id: 'discount_25',
    title: '%25 İndirim Kuponu',
    description: 'Herhangi bir partner işletmede büyük indirim.',
    icon: '🏷️',
    pointsCost: 600,
    category: 'discount',
    badge: 'Büyük İndirim',
  },
];

export const CATEGORY_LABELS: Record<StoreItem['category'], string> = {
  food: 'Yiyecek & İçecek',
  discount: 'İndirim Kuponları',
  premium: 'Premium Özellikler',
  special: 'Özel Güçler',
};
