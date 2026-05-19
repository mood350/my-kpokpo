'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Car, AlertTriangle, CheckCircle, Clock, RefreshCw,
} from 'lucide-react'
import { fetchMe, fetchInterventionsByGarage, type InterventionResponse } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VehicleRow {
  id:                  number
  licensePlate:        string
  brand:               string
  model:               string
  interventionCount:   number
  lastInterventionAt:  string | null
  lastInterventionId:  number | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLocalDate(iso: string | null): string {
  if (!iso) return '—'
  const [date] = iso.split('T')
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

type FreshnessStatus = 'recent' | 'mid' | 'old' | 'never'

function freshnessStatus(iso: string | null): FreshnessStatus {
  if (!iso) return 'never'
  const diff = (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
  if (diff < 30)  return 'recent'
  if (diff < 180) return 'mid'
  return 'old'
}

function freshnessColor(s: FreshnessStatus): string {
  if (s === 'recent') return 'var(--success)'
  if (s === 'mid')    return '#f59e0b'
  if (s === 'old')    return 'var(--danger)'
  return 'var(--text-muted)'
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width:           '100%',
  height:          38,
  padding:         '0 10px',
  backgroundColor: 'var(--bg-elevated)',
  border:          '1px solid var(--border)',
  borderRadius:    7,
  color:           'var(--text-primary)',
  fontSize:        13,
  outline:         'none',
  fontFamily:      'var(--font-body, "DM Sans", sans-serif)',
  transition:      'border-color 150ms ease',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GaragisteVehiclesPage() {
  const router = useRouter()

  const [vehicles,    setVehicles]    = useState<VehicleRow[]>([])
  const [loading,     setLoading]     = useState(true)
  const [fetchError,  setFetchError]  = useState<string | null>(null)
  const [search,      setSearch]      = useState('')

  // Construit le parc à partir des interventions du garage.
  // Le garagiste ne possède pas les véhicules — il voit ceux qui passent chez lui.
  const load = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const me = await fetchMe()
      if (!me.garageId) throw new Error('Aucun garage associé à ce compte.')

      const interventions = await fetchInterventionsByGarage(me.garageId)

      const map = new Map<number, VehicleRow>()
      for (const iv of interventions) {
        const existing = map.get(iv.vehicleId)
        if (!existing) {
          map.set(iv.vehicleId, {
            id:                 iv.vehicleId,
            licensePlate:       iv.vehicleLicensePlate,
            brand:              iv.vehicleBrand,
            model:              iv.vehicleModel,
            interventionCount:  1,
            lastInterventionAt: iv.interventionDate,
            lastInterventionId: iv.id,
          })
        } else {
          existing.interventionCount++
          if (!existing.lastInterventionAt || iv.interventionDate > existing.lastInterventionAt) {
            existing.lastInterventionAt = iv.interventionDate
            existing.lastInterventionId = iv.id
          }
        }
      }

      const rows = Array.from(map.values()).sort((a, b) => {
        if (!a.lastInterventionAt) return 1
        if (!b.lastInterventionAt) return -1
        return b.lastInterventionAt.localeCompare(a.lastInterventionAt)
      })

      setVehicles(rows)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      if (msg.includes('401')) { router.push('/login?redirect=/garage/vehicles'); return }
      setFetchError(msg)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return vehicles
    return vehicles.filter(v =>
      v.licensePlate.toLowerCase().includes(q) ||
      v.brand.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q)
    )
  }, [vehicles, search])

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        .vehicle-row:hover { background-color: var(--bg-elevated); }
        .form-input:focus  { border-color: var(--accent) !important; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 2px' }}>

        {/* ── Page header ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2
                className="font-display"
                style={{ fontSize: 22, fontWeight: 400, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
              >
                Véhicules pris en charge
              </h2>
              {!loading && !fetchError && (
                <span
                  style={{
                    display:         'inline-flex',
                    alignItems:      'center',
                    height:          22,
                    padding:         '0 8px',
                    borderRadius:    11,
                    backgroundColor: 'var(--accent-muted)',
                    color:           'var(--accent)',
                    fontSize:        12,
                    fontWeight:      600,
                  }}
                >
                  {vehicles.length}
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              Liste des véhicules ayant été pris en charge par votre garage.
            </p>
          </div>
        </div>

        {/* ── Search bar ────────────────────────────────────────────── */}
        <div style={{ position: 'relative', maxWidth: 360 }}>
          <Search
            size={14}
            strokeWidth={1.75}
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
          />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par plaque, marque, modèle…"
            style={{ ...inputStyle, paddingLeft: 32 }}
            className="form-input"
          />
        </div>

        {/* ── Content area ──────────────────────────────────────────── */}

        {loading ? (
          /* Skeleton */
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border:          '1px solid var(--border)',
              borderRadius:    12,
              overflow:        'hidden',
            }}
          >
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                style={{
                  display:       'flex',
                  gap:           16,
                  padding:       '14px 20px',
                  borderBottom:  i < 4 ? '1px solid var(--border)' : 'none',
                  alignItems:    'center',
                }}
              >
                {[120, 80, 90, 70, 90].map((w, j) => (
                  <div
                    key={j}
                    style={{
                      height:          14,
                      width:           w,
                      borderRadius:    4,
                      backgroundColor: 'var(--bg-elevated)',
                      flexShrink:      0,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : fetchError ? (
          /* Error */
          <div
            style={{
              display:         'flex',
              flexDirection:   'column',
              alignItems:      'center',
              gap:             12,
              padding:         48,
              backgroundColor: 'var(--bg-surface)',
              border:          '1px solid var(--border)',
              borderRadius:    12,
              textAlign:       'center',
            }}
          >
            <AlertTriangle size={32} strokeWidth={1.5} style={{ color: 'var(--danger)' }} />
            <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{fetchError}</p>
            <button
              onClick={load}
              style={{
                display:         'flex',
                alignItems:      'center',
                gap:             6,
                height:          34,
                padding:         '0 14px',
                borderRadius:    7,
                border:          '1px solid var(--border)',
                backgroundColor: 'transparent',
                color:           'var(--text-secondary)',
                fontSize:        13,
                cursor:          'pointer',
                fontFamily:      'var(--font-body, "DM Sans", sans-serif)',
              }}
            >
              <RefreshCw size={13} strokeWidth={2} />
              Réessayer
            </button>
          </div>
        ) : filtered.length === 0 ? (
          /* Empty */
          <div
            style={{
              display:         'flex',
              flexDirection:   'column',
              alignItems:      'center',
              gap:             12,
              padding:         56,
              backgroundColor: 'var(--bg-surface)',
              border:          '1px solid var(--border)',
              borderRadius:    12,
              textAlign:       'center',
            }}
          >
            <div
              style={{
                width:           52,
                height:          52,
                borderRadius:    12,
                backgroundColor: 'var(--accent-muted)',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
              }}
            >
              <Car size={24} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                {search ? 'Aucun résultat' : 'Aucun véhicule pris en charge'}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                {search
                  ? 'Essayez un autre terme de recherche.'
                  : 'Les véhicules apparaîtront ici dès leur première intervention.'}
              </p>
            </div>
          </div>
        ) : (
          /* Table */
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border:          '1px solid var(--border)',
              borderRadius:    12,
              overflow:        'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Véhicule', 'Immatriculation', 'Interventions', 'Dernière prise en charge'].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        padding:         '10px 16px',
                        textAlign:       'left',
                        fontSize:        11,
                        fontWeight:      600,
                        color:           'var(--text-muted)',
                        textTransform:   'uppercase',
                        letterSpacing:   '0.06em',
                        whiteSpace:      'nowrap',
                        backgroundColor: 'var(--bg-elevated)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((v, idx) => {
                  const status = freshnessStatus(v.lastInterventionAt)
                  return (
                    <tr
                      key={v.id}
                      className="vehicle-row"
                      style={{
                        borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                        transition:   'background-color 120ms ease',
                      }}
                    >
                      {/* Véhicule */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                          {v.brand} {v.model}
                        </span>
                      </td>

                      {/* Immatriculation */}
                      <td style={{ padding: '12px 16px' }}>
                        <code
                          style={{
                            fontSize:        12,
                            fontWeight:      600,
                            color:           'var(--text-primary)',
                            backgroundColor: 'var(--bg-elevated)',
                            border:          '1px solid var(--border)',
                            borderRadius:    5,
                            padding:         '3px 7px',
                            letterSpacing:   '0.04em',
                            fontFamily:      '"JetBrains Mono", "Fira Code", monospace',
                          }}
                        >
                          {v.licensePlate}
                        </code>
                      </td>

                      {/* Nb interventions */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {v.interventionCount}
                        </span>
                      </td>

                      {/* Dernière intervention */}
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display:    'inline-flex',
                            alignItems: 'center',
                            gap:        5,
                            fontSize:   12,
                            color:      freshnessColor(status),
                          }}
                        >
                          {status === 'recent' ? <CheckCircle size={12} strokeWidth={2} /> :
                           status === 'old'    ? <AlertTriangle size={12} strokeWidth={2} /> :
                                                 <Clock size={12} strokeWidth={2} />}
                          {formatLocalDate(v.lastInterventionAt)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
