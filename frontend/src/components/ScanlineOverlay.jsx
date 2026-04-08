export default function ScanlineOverlay() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9997,
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,245,255,0.012) 2px, rgba(0,245,255,0.012) 4px)',
        backgroundSize: '100% 4px',
      }}
    />
  );
}
