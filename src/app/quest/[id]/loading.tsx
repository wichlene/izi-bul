export default function QuestLoading() {
  return (
    <div className="min-h-screen animate-pulse" style={{ background: '#f7f8f8' }}>
      <div style={{ height: 260, background: '#e0e3e7' }} />
      <div className="p-4 space-y-4">
        <div style={{ height: 22, background: '#e0e3e7', borderRadius: 8, width: '70%' }} />
        <div style={{ height: 14, background: '#e0e3e7', borderRadius: 6, width: '100%' }} />
        <div style={{ height: 14, background: '#e0e3e7', borderRadius: 6, width: '85%' }} />
        <div style={{ height: 52, background: '#e0e3e7', borderRadius: 16 }} />
        <div style={{ height: 52, background: '#e0e3e7', borderRadius: 16 }} />
      </div>
    </div>
  );
}
