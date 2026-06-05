export default function DashboardLoading() {
  return (
    <div className="p-3 space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: '#fff', border: '1px solid #eff3f4' }}>
          <div style={{ height: 160, background: '#f0f2f4' }} />
          <div style={{ padding: '14px 16px 16px' }}>
            <div style={{ height: 14, background: '#f0f2f4', borderRadius: 6, width: '60%', marginBottom: 8 }} />
            <div style={{ height: 11, background: '#f0f2f4', borderRadius: 6, width: '90%', marginBottom: 4 }} />
            <div style={{ height: 11, background: '#f0f2f4', borderRadius: 6, width: '70%', marginBottom: 16 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ height: 18, background: '#f0f2f4', borderRadius: 6, width: '30%' }} />
              <div style={{ height: 18, background: '#f0f2f4', borderRadius: 6, width: '35%' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
