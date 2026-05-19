'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronRight,
  BookOpen,
  type LucideIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { fetchMe, type UserProfile } from '@/lib/api'

// ─── Navigation items ─────────────────────────────────────────────────────────

interface NavItem {
  id:    string
  label: string
  href:  string
  icon:  LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',     label: "Vue d'ensemble",  href: '/dashboard',     icon: LayoutDashboard },
  { id: 'garages',       label: 'Garages',          href: '/garages',       icon: Building2       },
  { id: 'users',         label: 'Utilisateurs',     href: '/users',         icon: Users           },
  { id: 'conseils',      label: 'Conseils',         href: '/conseils',      icon: BookOpen        },
  { id: 'settings',      label: 'Paramètres',       href: '/settings',      icon: Settings        },
]

const SIDEBAR_WIDE      = 240
const SIDEBAR_COLLAPSED = 64

// ─── Composant ────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname   = usePathname()
  const router     = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [profile,   setProfile]   = useState<UserProfile | null>(null)

  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    document.cookie = 'auth_session=; path=/; max-age=0; SameSite=Strict'
    router.push('/login')
  }

  useEffect(() => {
    fetchMe().then(setProfile).catch(() => null)
  }, [])

  // Synchronise la variable CSS utilisée par le layout pour son margin-left
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-current-width',
      collapsed ? `${SIDEBAR_COLLAPSED}px` : `${SIDEBAR_WIDE}px`
    )
  }, [collapsed])

  const width = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDE

  // Vérifie si un item est actif (startsWith pour sub-routes futures)
  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard' || pathname === '/' || pathname === '/demo'
      : pathname.startsWith(href)

  return (
    <aside
      style={{
        position:        'fixed',
        top:             0,
        left:            0,
        height:          '100vh',
        width:           width,
        minWidth:        width,
        backgroundColor: 'var(--bg-surface)',
        borderRight:     '1px solid var(--border)',
        display:         'flex',
        flexDirection:   'column',
        transition:      'width 220ms cubic-bezier(0.4, 0, 0.2, 1)',
        overflow:        'hidden',
        zIndex:          40,
      }}
    >
      {/* ── Logo ────────────────────────────────────────────────────── */}
      <div
        style={{
          height:         'var(--header-height)',
          display:        'flex',
          alignItems:     'center',
          padding:        '0 16px',
          gap:            10,
          borderBottom:   '1px solid var(--border)',
          flexShrink:     0,
          overflow:       'hidden',
        }}
      >
        {/* Pastille accent */}
        <span
          aria-hidden="true"
          style={{
            display:         'inline-flex',
            alignItems:      'center',
            justifyContent:  'center',
            width:           32,
            height:          32,
            borderRadius:    8,
            backgroundColor: 'var(--accent-muted)',
            flexShrink:      0,
          }}
        >
          <span
            style={{
              width:           10,
              height:          10,
              borderRadius:    '50%',
              backgroundColor: 'var(--accent)',
              display:         'block',
            }}
          />
        </span>

        {/* Textes — masqués quand collapsed */}
        <div
          style={{
            opacity:        collapsed ? 0 : 1,
            transform:      collapsed ? 'translateX(-6px)' : 'translateX(0)',
            transition:     'opacity 180ms ease, transform 180ms ease',
            overflow:       'hidden',
            whiteSpace:     'nowrap',
            display:        'flex',
            flexDirection:  'column',
            lineHeight:     1.2,
          }}
        >
          <span
            className="font-display"
            style={{
              fontSize:    18,
              fontStyle:   'italic',
              fontWeight:  500,
              color:       'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            MyKpokpo
          </span>
          <span
            style={{
              fontSize:    10,
              fontWeight:  500,
              color:       'var(--text-secondary)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Plateforme
          </span>
        </div>

        {/* Bouton collapse — chevron discret tout à droite */}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Agrandir la sidebar' : 'Réduire la sidebar'}
          aria-label={collapsed ? 'Agrandir la sidebar' : 'Réduire la sidebar'}
          style={{
            marginLeft:      'auto',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            width:           26,
            height:          26,
            borderRadius:    6,
            border:          'none',
            backgroundColor: 'transparent',
            color:           'var(--text-muted)',
            cursor:          'pointer',
            flexShrink:      0,
            transition:      'background-color 150ms ease, color 150ms ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'
            e.currentTarget.style.color           = 'var(--text-secondary)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color           = 'var(--text-muted)'
          }}
        >
          <ChevronRight
            size={14}
            strokeWidth={2}
            style={{
              transform:  collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 220ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </button>
      </div>

      {/* ── Navigation ─────────────────────────────────────────────── */}
      <nav
        aria-label="Navigation principale"
        style={{
          flex:       1,
          overflowY:  'auto',
          overflowX:  'hidden',
          padding:    '12px 0',
        }}
      >
        {NAV_ITEMS.map(item => {
          const active  = isActive(item.href)
          const hovered = hoveredId === item.id
          const Icon    = item.icon

          return (
            <Link
              key={item.id}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-current={active ? 'page' : undefined}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display:         'flex',
                alignItems:      'center',
                gap:             10,
                height:          40,
                padding:         collapsed ? '0 20px' : '0 16px',
                margin:          '1px 8px',
                borderRadius:    8,
                textDecoration:  'none',
                overflow:        'hidden',
                whiteSpace:      'nowrap',
                borderLeft:      active
                  ? '3px solid var(--accent)'
                  : '3px solid transparent',
                backgroundColor: active
                  ? 'var(--accent-muted)'
                  : hovered
                  ? 'var(--bg-elevated)'
                  : 'transparent',
                color: active
                  ? 'var(--accent)'
                  : 'var(--text-secondary)',
                transition: 'background-color 150ms ease, color 150ms ease, border-color 150ms ease',
              }}
            >
              <Icon
                size={16}
                strokeWidth={active ? 2 : 1.75}
                style={{ flexShrink: 0 }}
                aria-hidden="true"
              />

              <span
                style={{
                  fontSize:   13,
                  fontWeight: active ? 500 : 400,
                  opacity:    collapsed ? 0 : 1,
                  transform:  collapsed ? 'translateX(-4px)' : 'translateX(0)',
                  transition: 'opacity 160ms ease, transform 160ms ease',
                  overflow:   'hidden',
                  flexShrink: 0,
                }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* ── Séparateur ──────────────────────────────────────────────── */}
      <div className="divider" style={{ flexShrink: 0 }} />

      {/* ── Avatar / Profil ─────────────────────────────────────────── */}
      <div
        style={{
          display:    'flex',
          alignItems: 'center',
          gap:        10,
          padding:    '12px 16px',
          overflow:   'hidden',
          flexShrink: 0,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            width:           32,
            height:          32,
            borderRadius:    '50%',
            backgroundColor: 'var(--accent-muted)',
            color:           'var(--accent)',
            flexShrink:      0,
          }}
        >
          {profile
            ? <ShieldCheck size={15} strokeWidth={2} />
            : <span style={{ fontSize: 12, fontWeight: 600 }}>…</span>}
        </span>

        <div
          style={{
            flex:       1,
            minWidth:   0,
            opacity:    collapsed ? 0 : 1,
            transform:  collapsed ? 'translateX(-4px)' : 'translateX(0)',
            transition: 'opacity 160ms ease, transform 160ms ease',
            overflow:   'hidden',
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
            {profile ? `${profile.firstName} ${profile.lastName}` : '—'}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
            Administrateur
          </p>
        </div>
      </div>

      {/* ── Déconnexion ─────────────────────────────────────────────── */}
      <button
        onClick={handleLogout}
        title={collapsed ? 'Déconnexion' : undefined}
        aria-label="Se déconnecter"
        style={{
          display:         'flex',
          alignItems:      'center',
          gap:             10,
          height:          40,
          padding:         collapsed ? '0 20px' : '0 16px',
          margin:          '1px 8px 12px',
          borderRadius:    8,
          border:          'none',
          backgroundColor: 'transparent',
          color:           'var(--text-muted)',
          cursor:          'pointer',
          width:           'calc(100% - 16px)',
          overflow:        'hidden',
          whiteSpace:      'nowrap',
          flexShrink:      0,
          textAlign:       'left',
          transition:      'background-color 150ms ease, color 150ms ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'
          e.currentTarget.style.color           = 'rgb(239,68,68)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color           = 'var(--text-muted)'
        }}
      >
        <LogOut size={16} strokeWidth={1.75} style={{ flexShrink: 0 }} aria-hidden="true" />
        <span
          style={{
            fontSize:   13,
            fontWeight: 400,
            opacity:    collapsed ? 0 : 1,
            transform:  collapsed ? 'translateX(-4px)' : 'translateX(0)',
            transition: 'opacity 160ms ease, transform 160ms ease',
            flexShrink: 0,
          }}
        >
          Déconnexion
        </span>
      </button>
    </aside>
  )
}
