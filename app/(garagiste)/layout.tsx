import GaragisteSidebar from '@/components/garagiste/Sidebar'
import GarageHeader     from '@/components/garagiste/Header'
import RoleGuard        from '@/components/RoleGuard'

export default function GarageLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allow="GARAGISTE">
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
        <GaragisteSidebar />
        <div
          style={{
            marginLeft:    'var(--sidebar-current-width, var(--sidebar-width))',
            transition:    'margin-left 220ms cubic-bezier(0.4, 0, 0.2, 1)',
            flex:          1,
            minWidth:      0,
            display:       'flex',
            flexDirection: 'column',
            minHeight:     '100vh',
          }}
        >
          <GarageHeader />
          <main
            style={{
              flex:          1,
              padding:       '28px 28px 40px',
              display:       'flex',
              flexDirection: 'column',
              gap:           24,
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  )
}
