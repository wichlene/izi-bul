export default function MapLoading() {
  return (
    <div className="h-screen flex items-center justify-center" style={{ background: '#e8ecef' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-2xl animate-pulse" style={{ background: '#ff6b2b' }} />
        <div style={{ width: 80, height: 10, background: '#d1d5db', borderRadius: 6 }} className="animate-pulse" />
      </div>
    </div>
  );
}
