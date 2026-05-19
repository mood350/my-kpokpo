'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search } from 'lucide-react'
import { fetchAdminUsers, type AdminUser } from '@/lib/api'

// ─── Badges ───────────────────────────────────────────────────────────────────

const ROLE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  ADMIN:     { bg: 'var(--accent-muted)',  color: 'var(--accent)',  label: 'Admin'     },
  GARAGISTE: { bg: 'var(--warning-muted)', color: 'var(--warning)', label: 'Garagiste' },
  CLIENT:    { bg: 'var(--success-muted)', color: 'var(--success)', label: 'Client'    },
}

function RoleBadge({ role }: { role: string }) {
  const s = ROLE_STYLE[role] ?? { bg: 'var(--bg-elevated)', color: 'var(--text-muted)', label: role }
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 600,
      padding: '3px 10px', borderRadius: 20,
      backgroundColor: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  )
}

function StatusDot({ enabled }: { enabled: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: enabled ? 'var(--success)' : 'var(--text-muted)' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: enabled ? 'var(--success)' : 'var(--border)', display: 'block' }} />
      {enabled ? 'Actif' : 'Inactif'}
    </span>
  )
}

// ─── Squelette ────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ height: 40, borderRadius: 8, backgroundColor: 'var(--bg-elevated)', animation: 'pulse 1.5s ease-in-out infinite', width: 280 }} />
      <div className="card" style={{ height: 320, backgroundColor: 'var(--bg-elevated)', animation: 'pulse 1.5s ease-in-out infinite' }} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type RoleFilter = 'all' | 'GARAGISTE' | 'CLIENT' | 'ADMIN'

export default function UsersPage() {
  const [users,   setUsers]   = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [search,  setSearch]  = useState('')
  const [role,    setRole]    = useState<RoleFilter>('all')

  useEffect(() => {
    fetchAdminUsers()
      .then(setUsers)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return users
      .filter(u => role === 'all' || u.role === role)
      .filter(u => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
          u.firstName.toLowerCase().includes(q)  ||
          u.lastName.toLowerCase().includes(q)   ||
          u.email.toLowerCase().includes(q)      ||
          (u.garageName ?? '').toLowerCase().includes(q)
        )
      })
  }, [users, role, search])

  if (loading) return <LoadingSkeleton />
  if (error)   return (
    <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--danger)' }}>{error}</div>
  )

  const counts = {
    all:       users.length,
    GARAGISTE: users.filter(u => u.role === 'GARAGISTE').length,
    CLIENT:    users.filter(u => u.role === 'CLIENT').length,
    ADMIN:     users.filter(u => u.role === 'ADMIN').length,
  }

  const FILTERS: { key: RoleFilter; label: string }[] = [
    { key: 'all',       label: `Tous (${counts.all})`             },
    { key: 'GARAGISTE', label: `Garagistes (${counts.GARAGISTE})` },
    { key: 'CLIENT',    label: `Clients (${counts.CLIENT})`       },
    { key: 'ADMIN',     label: `Admins (${counts.ADMIN})`         },
  ]

  const HEADERS = ['Utilisateur', 'Email', 'Rôle', 'Garage', 'Statut', 'Inscription']

  return (
    <>
      {/* ── Barre de recherche + filtres ──────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 360 }}>
          <Search size={14} strokeWidth={1.75} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Rechercher un utilisateur, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', height: 38, padding: '0 12px 0 36px',
              backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text-primary)', fontSize: 13,
              outline: 'none', fontFamily: 'var(--font-body)',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
            onBlur={e  => { e.currentTarget.style.borderColor = 'var(--border)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 4, backgroundColor: 'var(--bg-elevated)', borderRadius: 8, padding: 3 }}>
          {FILTERS.map(f => {
            const active = role === f.key
            return (
              <button
                key={f.key}
                onClick={() => setRole(f.key)}
                style={{
                  padding: '4px 14px', borderRadius: 6, border: 'none', fontSize: 12,
                  fontWeight: active ? 600 : 400, cursor: 'pointer', fontFamily: 'var(--font-body)',
                  backgroundColor: active ? 'var(--bg-surface)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  transition: 'all 150ms ease',
                }}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <p style={{ padding: '32px 24px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
            Aucun utilisateur trouvé.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {HEADERS.map(h => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr
                    key={u.id}
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background-color 120ms ease' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-elevated)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                          backgroundColor: 'var(--accent-muted)', color: 'var(--accent)',
                          fontSize: 12, fontWeight: 600,
                        }}>
                          {u.firstName[0]}{u.lastName[0]}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                          {u.firstName} {u.lastName}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <RoleBadge role={u.role} />
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {u.garageName ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <StatusDot enabled={u.enabled} />
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className="nums" style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {u.createdAt ?? '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
