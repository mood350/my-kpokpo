import Sidebar    from '@/components/admin/Sidebar'
import Header     from '@/components/admin/Header'
import RoleGuard  from '@/components/RoleGuard'

/*
 * Layout Server Component — pas de 'use client'.
 * Sidebar et Header sont des Client Components importés ici :
 * React gère automatiquement la boundary RSC → CC.
 *
 * margin-left du contenu : piloté par la CSS variable --sidebar-current-width,
 * mise à jour par la Sidebar via document.documentElement.style.setProperty()
 * à chaque toggle collapse. Valeur initiale définie dans globals.css (240px).
 */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allow="ADMIN">
    <div
      style={{
        display:    'flex',
        minHeight:  '100vh',
        backgroundColor: 'var(--bg-base)',
      }}
    >
      {/* ── Sidebar (position: fixed, gère sa propre largeur) ─── */}
      <Sidebar />

      {/* ── Zone de contenu principal ─────────────────────────── */}
      <div
        style={{
          /*
           * margin-left suit --sidebar-current-width (240px → 64px) mis à jour
           * par la Sidebar. La transition CSS ici synchronise l'animation.
           */
          marginLeft:     'var(--sidebar-current-width, var(--sidebar-width))',
          transition:     'margin-left 220ms cubic-bezier(0.4, 0, 0.2, 1)',
          flex:           1,
          minWidth:       0,       /* évite le débordement horizontal sur petits écrans */
          display:        'flex',
          flexDirection:  'column',
          minHeight:      '100vh',
        }}
      >
        {/* Header sticky — position: sticky dans ce conteneur scrollable */}
        <Header />

        {/* Contenu de la page */}
        <main
          style={{
            flex:       1,
            padding:    '28px 28px 40px',
            display:    'flex',
            flexDirection: 'column',
            gap:        24,
          }}
        >
          {children}
        </main>
      </div>
    </div>
    </RoleGuard>
  )
}
