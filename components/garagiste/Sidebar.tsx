'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Car,
  CalendarClock,
  Wrench,
  Package,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  MessageSquare,
  BookOpen,
  type LucideIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { fetchMe, fetchConversations, type UserProfile } from '@/lib/api'

interface NavItem {
  id:    string
  label: string
  href:  string
  icon:  LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',     label: 'Tableau de bord', href: '/garage/dashboard',     icon: LayoutDashboard },
  { id: 'appointments',  label: 'Rendez-vous',      href: '/garage/appointments',  icon: CalendarClock   },
  { id: 'interventions', label: 'Interventions',    href: '/garage/interventions', icon: Wrench          },
  { id: 'vehicles',      label: 'Véhicules',        href: '/garage/vehicles',      icon: Car             },
  { id: 'parts',         label: 'Stock pièces',     href: '/garage/parts',         icon: Package         },
  { id: 'technicians',   label: 'Techniciens',      href: '/garage/technicians',   icon: Users           },
  { id: 'invoices',      label: 'Factures',         href: '/garage/invoices',      icon: FileText        },
  { id: 'messages',      label: 'Messages',         href: '/garage/messages',      icon: MessageSquare   },
  { id: 'conseils',      label: 'Conseils',         href: '/garage/conseils',      icon: BookOpen        },
  { id: 'reports',       label: 'Statistiques',     href: '/garage/reports',       icon: BarChart3       },
  { id: 'settings',      label: 'Paramètres',       href: '/garage/settings',      icon: Settings        },
]

const SIDEBAR_WIDE      = 240
const SIDEBAR_COLLAPSED = 64

export default function GaragisteSidebar() {
  const pathname   = usePathname()
  const router     = useRouter()
  const [collapsed,      setCollapsed]      = useState(false)
  const [hoveredId,      setHoveredId]      = useState<string | null>(null)
  const [profile,        setProfile]        = useState<UserProfile | null>(null)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    fetchMe().then(setProfile).catch(() => null)
  }, [])

  useEffect(() => {
    if (!profile?.garageId) return
    const load = async () => {
      try {
        const convs = await fetchConversations(profile.garageId!)
        setUnreadMessages(convs.reduce((sum, c) => sum + c.unreadCount, 0))
      } catch { /* endpoint may not exist yet */ }
    }
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [profile?.garageId])

  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    document.cookie = 'auth_session=; path=/; max-age=0; SameSite=Strict'
    router.push('/login')
  }

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-current-width',
      collapsed ? `${SIDEBAR_COLLAPSED}px` : `${SIDEBAR_WIDE}px`
    )
  }, [collapsed])

  const width    = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDE
  const isActive = (href: string) => pathname.startsWith(href)

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
      {/* Logo */}
      <div
        style={{
          height:       'var(--header-height)',
          display:      'flex',
          alignItems:   'center',
          padding:      '0 16px',
          gap:          10,
          borderBottom: '1px solid var(--border)',
          flexShrink:   0,
          overflow:     'hidden',
        }}
      >
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

        <div
          style={{
            opacity:       collapsed ? 0 : 1,
            transform:     collapsed ? 'translateX(-6px)' : 'translateX(0)',
            transition:    'opacity 180ms ease, transform 180ms ease',
            overflow:      'hidden',
            whiteSpace:    'nowrap',
            display:       'flex',
            flexDirection: 'column',
            lineHeight:    1.2,
          }}
        >
          <span
            className="font-display"
            style={{ fontSize: 18, fontStyle: 'italic', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
          >
            MyKpokpo
          </span>
          <span
            style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            Garage
          </span>
        </div>

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
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          <ChevronRight
            size={14}
            strokeWidth={2}
            style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 220ms cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Navigation principale"
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 0' }}
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
                borderLeft:      active ? '3px solid var(--accent)' : '3px solid transparent',
                backgroundColor: active ? 'var(--accent-muted)' : hovered ? 'var(--bg-elevated)' : 'transparent',
                color:           active ? 'var(--accent)' : 'var(--text-secondary)',
                transition:      'background-color 150ms ease, color 150ms ease, border-color 150ms ease',
              }}
            >
              <Icon size={16} strokeWidth={active ? 2 : 1.75} style={{ flexShrink: 0 }} aria-hidden="true" />
              <span
                style={{
                  fontSize:   13,
                  fontWeight: active ? 500 : 400,
                  opacity:    collapsed ? 0 : 1,
                  transform:  collapsed ? 'translateX(-4px)' : 'translateX(0)',
                  transition: 'opacity 160ms ease, transform 160ms ease',
                  overflow:   'hidden',
                  flexShrink: 0,
                  flex:       1,
                }}
              >
                {item.label}
              </span>
              {item.id === 'messages' && unreadMessages > 0 && !collapsed && (
                <span style={{
                  backgroundColor: 'var(--accent)',
                  color:           '#fff',
                  fontSize:        10,
                  fontWeight:      600,
                  borderRadius:    10,
                  padding:         '1px 5px',
                  flexShrink:      0,
                  lineHeight:      1.6,
                }}>
                  {unreadMessages}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="divider" style={{ flexShrink: 0 }} />

      {/* Profil */}
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
            fontSize:        12,
            fontWeight:      600,
            flexShrink:      0,
            letterSpacing:   '0.02em',
          }}
        >
          {profile ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase() : '…'}
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
            {profile?.garageName ?? 'Mon garage'}
          </p>
        </div>
      </div>

      {/* Déconnexion */}
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
