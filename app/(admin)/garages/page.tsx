'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, BadgeCheck, Clock, Loader2 } from 'lucide-react'
import { fetchAdminGarages, toggleGarageVerify, type AdminGarage } from '@/lib/api'

// ─── Badge statut ─────────────────────────────────────────────────────────────

function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
      backgroundColor: verified ? 'var(--success-muted)' : 'var(--warning-muted)',
      color:           verified ? 'var(--success)'       : 'var(--warning)',
    }}>
      {verified
        ? <BadgeCheck size={12} strokeWidth={2} />
        : <Clock      size={12} strokeWidth={2} />}
      {verified ? 'Vérifié' : 'En attente'}
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

export default function GaragesPage() {
  const [garages,   setGarages]   = useState<AdminGarage[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState<'all' | 'verified' | 'pending'>('all')
  const [toggling,  setToggling]  = useState<number | null>(null)

  useEffect(() => {
    fetchAdminGarages()
      .then(setGarages)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return garages
      .filter(g => {
        if (filter === 'verified') return g.verified
        if (filter === 'pending')  return !g.verified
        return true
      })
      .filter(g => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
          g.name.toLowerCase().includes(q)      ||
          g.city.toLowerCase().includes(q)      ||
          g.ownerName.toLowerCase().includes(q) ||
          g.ownerEmail.toLowerCase().includes(q)
        )
      })
  }, [garages, filter, search])

  async function handleToggle(id: number) {
    setToggling(id)
    try {
      const updated = await toggleGarageVerify(id)
      setGarages(prev => prev.map(g => g.id === id ? updated : g))
    } catch {
      // silently ignore — production devrait afficher une toast
    } finally {
      setToggling(null)
    }
  }

  if (loading) return <LoadingSkeleton />
  if (error)   return (
    <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--danger)' }}>{error}</div>
  )

  const total    = garages.length
  const verified = garages.filter(g => g.verified).length
  const pending  = total - verified

  const FILTERS: { key: typeof filter; label: string; count: number }[] = [
    { key: 'all',      label: 'Tous',         count: total    },
    { key: 'verified', label: 'Vérifiés',     count: verified },
    { key: 'pending',  label: 'En attente',   count: pending  },
  ]

  const HEADERS = ['Garage', 'Ville', 'Propriétaire', 'Contact', 'Statut', 'Inscription', 'Action']

  return (
    <>
      {/* ── Barre de recherche + filtres ──────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 360 }}>
          <Search size={14} strokeWidth={1.75} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Rechercher un garage, propriétaire…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', height: 38, padding: '0 12px 0 36px',
              backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text-primary)', fontSize: 13,
              outline: 'none', fontFamily: 'var(--font-body)',
            }}
            onFocus={e  => { e.currentTarget.style.borderColor = 'var(--accent)' }}
            onBlur={e   => { e.currentTarget.style.borderColor = 'var(--border)' }}
          />
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 4, backgroundColor: 'var(--bg-elevated)', borderRadius: 8, padding: 3 }}>
          {FILTERS.map(f => {
            const active = filter === f.key
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '4px 14px', borderRadius: 6, border: 'none', fontSize: 12,
                  fontWeight: active ? 600 : 400, cursor: 'pointer', fontFamily: 'var(--font-body)',
                  backgroundColor: active ? 'var(--bg-surface)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  transition: 'all 150ms ease',
                }}
              >
                {f.label}{' '}
                <span style={{ opacity: 0.7 }}>({f.count})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <p style={{ padding: '32px 24px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
            Aucun garage trouvé.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
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
                {filtered.map((g, i) => (
                  <tr
                    key={g.id}
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background-color 120ms ease' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-elevated)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{g.name}</p>
                      {g.address && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{g.address}</p>}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{g.city}</span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>{g.ownerName}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{g.ownerEmail}</p>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{g.phone ?? '—'}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{g.email ?? '—'}</p>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <VerifiedBadge verified={g.verified} />
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className="nums" style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {g.createdAt ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <button
                        onClick={() => handleToggle(g.id)}
                        disabled={toggling === g.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)',
                          backgroundColor: 'transparent', cursor: toggling === g.id ? 'not-allowed' : 'pointer',
                          fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)',
                          fontFamily: 'var(--font-body)', opacity: toggling === g.id ? 0.6 : 1,
                          whiteSpace: 'nowrap', transition: 'all 150ms ease',
                        }}
                        onMouseEnter={e => { if (toggling !== g.id) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' } }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                      >
                        {toggling === g.id
                          ? <Loader2 size={11} style={{ animation: 'spin 0.8s linear infinite' }} />
                          : null}
                        {g.verified ? 'Révoquer' : 'Vérifier'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
