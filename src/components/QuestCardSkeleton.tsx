export default function QuestCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse" style={{ background: '#fff', border: '1px solid #eff3f4' }}>
      <div style={{ height: 160, background: '#f0f2f4' }} />
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <div style={{ height: 20, width: 60, borderRadius: 20, background: '#f0f2f4' }} />
          <div style={{ height: 20, width: 44, borderRadius: 20, background: '#f0f2f4' }} />
        </div>
        <div style={{ height: 18, width: '75%', borderRadius: 6, background: '#f0f2f4', marginBottom: 8 }} />
        <div style={{ height: 14, width: '55%', borderRadius: 6, background: '#f0f2f4', marginBottom: 14 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ height: 28, width: 72, borderRadius: 20, background: '#f0f2f4' }} />
          <div style={{ height: 36, width: 80, borderRadius: 12, background: '#f0f2f4' }} />
        </div>
      </div>
    </div>
  );
}

export function QuestGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => <QuestCardSkeleton key={i} />)}
    </div>
  );
}
