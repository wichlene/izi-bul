import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import AppShell from '@/components/AppShell';
import { Check, Zap, Crown, Rocket } from 'lucide-react';

export const metadata = {
  title: 'İşletme Planları — İzi Bul',
};

const PLANS = [
  {
    id: 'free',
    name: 'Başlangıç',
    price: 'Ücretsiz',
    icon: <Zap size={24} className="text-white" />,
    color: '#536471',
    bg: 'linear-gradient(135deg,#536471,#374151)',
    features: [
      'Ayda 1 aktif görev',
      'Temel analitik',
      'Standart listeleme',
      '50 katılımcıya kadar',
      'E-posta desteği',
    ],
    missing: [
      'Öne çıkarılma',
      'Sınırsız görev',
      'Detaylı analitik',
      'AI fotoğraf doğrulama',
    ],
    cta: 'Mevcut Plan',
    ctaDisabled: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '499₺',
    period: '/ay',
    icon: <Rocket size={24} className="text-white" />,
    color: '#ff6b2b',
    bg: 'linear-gradient(135deg,#ff6b2b,#ff3d00)',
    badge: 'En Popüler',
    features: [
      'Sınırsız aktif görev',
      'Öne çıkarılma (3 gün/ay)',
      'Detaylı katılımcı analitikleri',
      'AI fotoğraf doğrulama',
      'Bildirim yayını',
      'Öncelikli destek',
      'Puan mağazası entegrasyonu',
    ],
    missing: [],
    cta: 'Pro\'ya Geç',
    ctaDisabled: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '999₺',
    period: '/ay',
    icon: <Crown size={24} className="text-white" />,
    color: '#a855f7',
    bg: 'linear-gradient(135deg,#a855f7,#7c3aed)',
    badge: 'Tam Güç',
    features: [
      'Pro\'nun tümü',
      'Günlük Görev kadrosu',
      'Beyaz etiketli QR kuponlar',
      'API erişimi',
      'Özel kampanya sayfası',
      'Sezon sponsorluğu',
      '7/24 öncelikli destek',
    ],
    missing: [],
    cta: 'Premium\'a Geç',
    ctaDisabled: false,
  },
];

export default async function BusinessPlansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isBusiness = false;
  let currentPlan = 'free';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_business, subscription_plan')
      .eq('id', user.id)
      .single();
    isBusiness = profile?.is_business || false;
    currentPlan = profile?.subscription_plan || 'free';
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Başlık */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
            <Crown size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black" style={{ color: '#0f1419' }}>İşletme Planları</h1>
          <p className="text-sm mt-2" style={{ color: '#536471' }}>
            Doğru plan ile müşterilerin seni bulsun, senin işletmeni tercih etsin.
          </p>
        </div>

        {/* Planlar */}
        <div className="space-y-4">
          {PLANS.map(plan => {
            const isCurrent = currentPlan === plan.id;
            return (
              <div key={plan.id} className="rounded-2xl overflow-hidden"
                style={{ border: `2px solid ${isCurrent ? plan.color : '#eff3f4'}` }}>
                {/* Plan header */}
                <div className="p-4 text-white" style={{ background: plan.bg }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.2)' }}>
                        {plan.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-black">{plan.name}</h2>
                          {plan.badge && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(255,255,255,0.25)' }}>
                              {plan.badge}
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(255,255,255,0.25)' }}>
                              Mevcut
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black">{plan.price}</span>
                          {plan.period && <span className="text-sm opacity-80">{plan.period}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Özellikler */}
                <div className="p-4 space-y-2" style={{ background: '#fff' }}>
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(34,197,94,0.1)' }}>
                        <Check size={11} style={{ color: '#22c55e' }} />
                      </div>
                      <span className="text-sm" style={{ color: '#0f1419' }}>{f}</span>
                    </div>
                  ))}
                  {plan.missing.map(f => (
                    <div key={f} className="flex items-center gap-2.5 opacity-35">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: '#eff3f4' }}>
                        <Check size={11} style={{ color: '#9ca3af' }} />
                      </div>
                      <span className="text-sm" style={{ color: '#536471' }}>{f}</span>
                    </div>
                  ))}

                  {!plan.ctaDisabled && (
                    <div className="pt-3">
                      <Link
                        href={`/contact?subject=Plan yükseltme: ${plan.name}&plan=${plan.id}`}
                        className="block w-full py-3 rounded-full font-black text-sm text-center text-white transition-opacity hover:opacity-90"
                        style={{ background: plan.bg }}>
                        {plan.cta}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#8e8e8e' }}>
          Sorularınız için <Link href="/contact" className="underline" style={{ color: '#ff6b2b' }}>iletişime geç</Link>. KDV dahildir. Aylık fatura.
        </p>
      </div>
    </AppShell>
  );
}
