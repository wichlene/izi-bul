import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'İzi Bul';
  const reward = searchParams.get('reward') || '';
  const category = searchParams.get('category') || '';
  const region = searchParams.get('region') || 'Türkiye';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Orange top bar */}
        <div style={{ height: 8, background: 'linear-gradient(90deg, #ff6b2b, #ff3d00)', width: '100%' }} />

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '48px 56px', justifyContent: 'space-between' }}>
          {/* Logo row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <span style={{ fontSize: 26, fontWeight: 900, color: '#ff6b2b' }}>İzi Bul</span>
          </div>

          {/* Quest title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {category && (
              <div style={{
                display: 'inline-flex', alignItems: 'center',
                background: 'rgba(255,107,43,0.1)', border: '1px solid rgba(255,107,43,0.25)',
                borderRadius: 100, padding: '6px 16px', width: 'fit-content',
              }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#ff6b2b' }}>{category}</span>
              </div>
            )}
            <div style={{ fontSize: 52, fontWeight: 900, color: '#0f1419', lineHeight: 1.1 }}>{title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#536471', fontSize: 20 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#536471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{region}</span>
            </div>
          </div>

          {/* Bottom row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#536471', fontSize: 18 }}>
              <span>Konumu bul → Fotoğrafı gönder → Ödülü kazan</span>
            </div>
            {reward && (
              <div style={{
                background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)',
                borderRadius: 16, padding: '12px 24px',
              }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>₺{reward} Ödül</span>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
