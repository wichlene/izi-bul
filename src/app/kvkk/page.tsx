import Link from 'next/link';
import { MapPin } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası & KVKK — İzi Bul',
  description: 'İzi Bul kişisel verilerin korunması ve gizlilik politikası.',
};

export default function KvkkPage() {
  return (
    <div className="min-h-screen" style={{ background: '#f7f8f8' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eff3f4', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={16} color="#fff" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#0f1419' }}>İzi Bul</span>
        </Link>
      </div>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f1419', marginBottom: 8 }}>Gizlilik Politikası & KVKK Aydınlatma Metni</h1>
        <p style={{ fontSize: 13, color: '#8e9aab', marginBottom: 36 }}>Son güncelleme: Mayıs 2026</p>

        <Section title="1. Veri Sorumlusu">
          <p>6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında veri sorumlusu <strong>İzi Bul</strong> (&quot;Şirket&quot;, &quot;biz&quot;) olup uygulamayı işletmektedir.</p>
          <p style={{ marginTop: 8 }}>İletişim: <a href="mailto:kvkk@izibul.com" style={{ color: '#ff6b2b' }}>kvkk@izibul.com</a></p>
        </Section>

        <Section title="2. Toplanan Kişisel Veriler">
          <ul>
            <li><strong>Hesap bilgileri:</strong> Ad-soyad, kullanıcı adı, e-posta adresi, şifre (şifrelenmiş olarak).</li>
            <li><strong>İletişim bilgileri:</strong> Telefon numarası (isteğe bağlı).</li>
            <li><strong>Konum verisi:</strong> Görev çözümü sırasında ve &quot;Canlı Konum&quot; özelliği aktifse anlık GPS koordinatları.</li>
            <li><strong>Kullanım verisi:</strong> Tamamlanan görevler, kazanılan puanlar, uygulama içi aktiviteler.</li>
            <li><strong>Teknik veriler:</strong> IP adresi, cihaz türü, tarayıcı bilgisi, çerezler.</li>
            <li><strong>Fotoğraflar:</strong> Görev tamamlama kanıtı olarak yüklediğiniz fotoğraflar.</li>
          </ul>
        </Section>

        <Section title="3. Kişisel Verilerin İşlenme Amaçları">
          <ul>
            <li>Hesap oluşturma ve kullanıcı kimlik doğrulaması</li>
            <li>Görev mekanizmasının çalıştırılması ve ödül dağıtımı</li>
            <li>Konum bazlı görev eşleştirmesi</li>
            <li>Güvenlik, dolandırıcılık önleme ve platform bütünlüğünün korunması</li>
            <li>Müşteri desteği ve bildirim gönderimi</li>
            <li>İstatistiksel analiz ve hizmet geliştirme</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
          </ul>
        </Section>

        <Section title="4. Hukuki Dayanak">
          <p>Kişisel verileriniz; sözleşmenin ifası (KVKK m.5/2-c), meşru menfaat (KVKK m.5/2-f), açık rıza (KVKK m.5/1) ve yasal yükümlülük (KVKK m.5/2-ç) kapsamında işlenmektedir.</p>
        </Section>

        <Section title="5. Konum Verisi">
          <p>Konum veriniz yalnızca görev sırasında ve &quot;Canlı Konum&quot; özelliğini açıkça etkinleştirdiğinizde toplanır. Bu özelliği Profil sayfasından istediğiniz zaman kapatabilirsiniz. Konum veriniz üçüncü taraflarla paylaşılmaz; yalnızca görev doğrulama amacıyla kullanılır.</p>
        </Section>

        <Section title="6. Veri Saklama Süresi">
          <ul>
            <li>Aktif hesap verileri: Hesap silinene kadar</li>
            <li>Görev ve ödül kayıtları: 5 yıl (ticari kayıt zorunluluğu)</li>
            <li>Konum geçmişi: 90 gün</li>
            <li>Güvenlik logları: 1 yıl</li>
          </ul>
        </Section>

        <Section title="7. Verilerinizi Kimlerle Paylaşıyoruz">
          <ul>
            <li><strong>Supabase (veritabanı & kimlik doğrulama):</strong> Altyapı sağlayıcısı olarak AB GDPR standartlarında veri işler.</li>
            <li><strong>İşletmeler:</strong> Yalnızca kazandığınız görevin sahibi işletme, ödül için ad ve iletişim bilgilerinizi görebilir.</li>
            <li><strong>Yasal merciler:</strong> Mahkeme kararı veya yasal zorunluluk halinde.</li>
          </ul>
          <p style={{ marginTop: 8 }}>Kişisel verileriniz üçüncü taraflara satılmaz veya reklam amaçlı paylaşılmaz.</p>
        </Section>

        <Section title="8. Çerezler">
          <p>Oturum yönetimi için zorunlu çerezler kullanılmaktadır. Performans ve analitik çerezler için ayrıca onay alınmaktadır. Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz.</p>
        </Section>

        <Section title="9. KVKK Kapsamındaki Haklarınız">
          <p>KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
          <ul>
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme</li>
            <li>İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
            <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
            <li>Kanun&apos;da öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme</li>
            <li>İşlemenin otomatik sistemlerle yapılması halinde aleyhine ortaya çıkan sonuca itiraz etme</li>
            <li>Kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme</li>
          </ul>
          <p style={{ marginTop: 8 }}>Bu haklarınızı kullanmak için <a href="mailto:kvkk@izibul.com" style={{ color: '#ff6b2b' }}>kvkk@izibul.com</a> adresine e-posta gönderebilirsiniz.</p>
        </Section>

        <Section title="10. Veri Güvenliği">
          <p>Kişisel verilerinizi korumak için endüstri standardı güvenlik önlemleri uygulanmaktadır: SSL/TLS şifreleme, şifrelenmiş parola saklama, erişim kontrolü ve düzenli güvenlik denetimleri.</p>
        </Section>

        <Section title="11. Hesap Silme">
          <p>Hesabınızı ve tüm kişisel verilerinizi silmek için Profil {'>'} Düzenle bölümünden &quot;Hesabı Sil&quot; seçeneğini kullanabilir veya <a href="mailto:kvkk@izibul.com" style={{ color: '#ff6b2b' }}>kvkk@izibul.com</a> adresine e-posta gönderebilirsiniz. Talep 30 gün içinde işleme alınır.</p>
        </Section>

        <Section title="12. Politika Değişiklikleri">
          <p>Bu politikada yapılacak önemli değişikliklerde kayıtlı e-posta adresinize bildirim gönderilir. Güncel politikaya her zaman bu sayfadan ulaşabilirsiniz.</p>
        </Section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #eff3f4', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: '#ff6b2b', fontSize: 14, fontWeight: 600 }}>← Ana Sayfaya Dön</Link>
          <Link href="/contact" style={{ color: '#536471', fontSize: 14 }}>İletişim</Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f1419', marginBottom: 12 }}>{title}</h2>
      <div style={{ fontSize: 14, color: '#536471', lineHeight: 1.7 }}>
        {children}
      </div>
    </section>
  );
}
