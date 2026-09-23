'use client';

// global-error replaces the root layout, so globals.css is not loaded here and
// Tailwind classes would not apply. Inline styles keep this readable even when
// the failure is in the stylesheet or the layout itself.
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          fontFamily: 'system-ui, sans-serif',
          background: '#ffffff',
          color: '#09090b',
        }}
      >
        <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
          页面出错了，请重试
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            height: '2.5rem',
            padding: '0 1rem',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            background: '#09090b',
            color: '#ffffff',
            fontSize: '0.875rem',
          }}
        >
          重试
        </button>
      </body>
    </html>
  );
}
