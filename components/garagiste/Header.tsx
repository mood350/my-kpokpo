'use client'

import { usePathname } from 'next/navigation'
import { Search, Bell } from 'lucide-react'
import ThemeToggle from '@/components/admin/ThemeToggle'

const PAGE_TITLES: Record<string, string> = {
  '/garage/dashboard':     'Tableau de bord',
  '/garage/appointments':  'Rendez-vous',
  '/garage/interventions': 'Interventions',
  '/garage/vehicles':      'Véhicules',
  '/garage/parts':         'Stock pièces',
  '/garage/technicians':   'Techniciens',
  '/garage/invoices':      'Factures',
  '/garage/reports':       'Statistiques',
  '/garage/settings':      'Paramètres',
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  const match = Object.keys(PAGE_TITLES).find(key => pathname.startsWith(key))
  return match ? PAGE_TITLES[match] : 'MyKpokpo'
}

interface HeaderProps {
  unreadCount?: number
}

export default function GarageHeader({ unreadCount = 0 }: HeaderProps) {
  const pathname = usePathname()
  const title    = getPageTitle(pathname)

  return (
    <header
      style={{
        position:        'sticky',
        top:             0,
        height:          'var(--header-height)',
        backgroundColor: 'var(--bg-surface)',
        borderBottom:    '1px solid var(--border)',
        display:         'flex',
        alignItems:      'center',
        gap:             16,
        padding:         '0 24px',
        zIndex:          30,
        flexShrink:      0,
      }}
    >
      <h1
        className="font-display"
        style={{ fontSize: 22, fontWeight: 400, color: 'var(--text-primary)', whiteSpace: 'nowrap', flexShrink: 0, lineHeight: 1, letterSpacing: '-0.01em' }}
      >
        {title}
      </h1>

      <div
        role="search"
        style={{ flex: 1, maxWidth: 480, margin: '0 auto', position: 'relative', display: 'flex', alignItems: 'center' }}
      >
        <Search size={14} strokeWidth={1.75} aria-hidden="true" style={{ position: 'absolute', left: 12, color: 'var(--text-muted)', flexShrink: 0, pointerEvents: 'none' }} />
        <input
          type="search"
          placeholder="Rechercher…"
          aria-label="Rechercher"
          style={{
            width:           '100%',
            height:          36,
            paddingLeft:     34,
            paddingRight:    52,
            paddingTop:      0,
            paddingBottom:   0,
            backgroundColor: 'var(--bg-elevated)',
            border:          '1px solid var(--border)',
            borderRadius:    8,
            color:           'var(--text-primary)',
            fontSize:        13,
            outline:         'none',
            transition:      'border-color 150ms ease',
            fontFamily:      'var(--font-body, "DM Sans", sans-serif)',
          }}
          onFocus={e  => { e.currentTarget.style.borderColor = 'var(--accent)' }}
          onBlur={e   => { e.currentTarget.style.borderColor = 'var(--border)' }}
        />
        <kbd
          aria-hidden="true"
          style={{
            position:        'absolute',
            right:           10,
            display:         'flex',
            alignItems:      'center',
            gap:             2,
            padding:         '2px 5px',
            backgroundColor: 'var(--bg-surface)',
            border:          '1px solid var(--border)',
            borderRadius:    4,
            fontSize:        10,
            fontWeight:      500,
            color:           'var(--text-muted)',
            letterSpacing:   '0.02em',
            pointerEvents:   'none',
            lineHeight:      1.4,
            fontFamily:      'var(--font-body, "DM Sans", sans-serif)',
          }}
        >
          ⌘K
        </kbd>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 'auto' }}>
        <ThemeToggle />
        <div aria-hidden="true" style={{ width: 1, height: 20, backgroundColor: 'var(--border)', margin: '0 6px', flexShrink: 0 }} />
        <button
          title={unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : 'Notifications'}
          aria-label={unreadCount > 0 ? `${unreadCount} notifications` : 'Notifications'}
          style={{
            position:        'relative',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            width:           34,
            height:          34,
            borderRadius:    8,
            border:          'none',
            backgroundColor: 'transparent',
            color:           'var(--text-secondary)',
            cursor:          'pointer',
            flexShrink:      0,
            transition:      'background-color 150ms ease, color 150ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
        >
          <Bell size={16} strokeWidth={1.75} aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              style={{
                position:        'absolute',
                top:             5,
                right:           5,
                minWidth:        16,
                height:          16,
                padding:         '0 4px',
                borderRadius:    8,
                backgroundColor: 'var(--danger)',
                color:           '#FFFFFF',
                fontSize:        9,
                fontWeight:      700,
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                lineHeight:      1,
                border:          '1.5px solid var(--bg-surface)',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
