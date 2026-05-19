import Link from 'next/link'
import ThemeToggle from '@/components/admin/ThemeToggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight:       '100vh',
        backgroundColor: 'var(--bg-base)',
        display:         'flex',
        flexDirection:   'column',
        fontFamily:      'var(--font-body, "DM Sans", sans-serif)',
        color:           'var(--text-primary)',
      }}
    >
      {/* Top bar */}
      <header
        style={{
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'space-between',
          padding:         '16px 28px',
          flexShrink:      0,
          borderBottom:    '1px solid var(--border)',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span
            style={{
              display:         'inline-flex',
              alignItems:      'center',
              justifyContent:  'center',
              width:           28,
              height:          28,
              borderRadius:    7,
              backgroundColor: 'var(--accent-muted)',
            }}
          >
            <span
              style={{
                width:           8,
                height:          8,
                borderRadius:    '50%',
                backgroundColor: 'var(--accent)',
                display:         'block',
              }}
            />
          </span>
          <span
            className="font-display"
            style={{
              fontSize:      16,
              fontStyle:     'italic',
              fontWeight:    500,
              color:         'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            MyKpokpo
          </span>
        </Link>

        <ThemeToggle />
      </header>

      {/* Centered form area */}
      <main
        style={{
          flex:            1,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          padding:         '32px 16px 64px',
        }}
      >
        {children}
      </main>
    </div>
  )
}
