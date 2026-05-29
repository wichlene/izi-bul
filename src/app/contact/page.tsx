import AppShell from '@/components/AppShell';
import ContactForm from './ContactForm';

export const metadata = { title: 'İletişim — İzi Bul' };

export default function ContactPage() {
  return (
    <AppShell>
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-black mb-2" style={{ color: '#0f1419' }}>İletişim & İş Birliği</h1>
        <p className="text-sm mb-6" style={{ color: '#536471' }}>
          İşletmen için görev oluşturmak, yatırımcı olmak veya bir fikir paylaşmak mı istiyorsun? Yaz, sana dönelim.
        </p>
        <div className="rounded-2xl p-6" style={{ background: '#fff', border: '1px solid #eff3f4' }}>
          <ContactForm />
        </div>
      </main>
    </AppShell>
  );
}
