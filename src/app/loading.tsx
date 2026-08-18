export default function Loading() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: 'Cairo, sans-serif',
      }}
    >
      {/* Animated Logo */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #059669, #0d9488)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L12 8" />
          <path d="M12 8C12 8 8 12 6 14" />
          <path d="M12 8C12 8 16 12 18 14" />
          <circle cx="6" cy="16" r="2" />
          <circle cx="18" cy="16" r="2" />
          <circle cx="12" cy="10" r="2" />
          <path d="M6 18L6 22" />
          <path d="M18 18L18 22" />
          <circle cx="4" cy="22" r="1.5" fill="white" />
          <circle cx="8" cy="22" r="1.5" fill="white" />
          <circle cx="16" cy="22" r="1.5" fill="white" />
          <circle cx="20" cy="22" r="1.5" fill="white" />
        </svg>
      </div>

      {/* Title */}
      <h1
        style={{
          color: '#34d399',
          fontSize: 22,
          fontWeight: 800,
          margin: '0 0 8px 0',
          letterSpacing: '0.5px',
        }}
      >
        منصة شجرة العائلة الكبرى
      </h1>

      {/* Subtitle */}
      <p
        style={{
          color: '#94a3b8',
          fontSize: 14,
          margin: '0 0 32px 0',
        }}
      >
        جاري تحميل البيانات والمنصة...
      </p>

      {/* Loading Bar */}
      <div
        style={{
          width: 200,
          height: 4,
          backgroundColor: '#1e293b',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '40%',
            height: '100%',
            backgroundColor: '#10b981',
            borderRadius: 4,
            animation: 'loading-bar 1.2s ease-in-out infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}
