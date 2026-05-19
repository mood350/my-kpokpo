'use client'

import { useState, useEffect } from 'react'
import {
  Building2,
  BadgeCheck,
  TrendingUp,
  Users,
  Wrench,
  Banknote,
  UserCheck,
  Activity,
  type LucideIcon,
} from 'lucide-react'
import { fetchAdminStats, type AdminStats } from '@/lib/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFCFA(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} M`
  if (value >= 1_000)     return `${(value / 1_000).toFixed(0)} k`
  return String(value)
}

function pct(part: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((part / total) * 100)}%`
}

// ─── Composants ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label:      string
  value:      string
  sub?:       string
  icon:       LucideIcon
  iconColor:  string
  iconBg:     string
  highlight?: boolean
}

function StatCard({ label, value, sub, icon: Icon, iconColor, iconBg, highlight }: StatCardProps) {
  return (
    <div
      className="card card-hover animate-fade-in"
      style={{
        position:        'relative',
        minHeight:       120,
        ...(highlight && { borderColor: 'var(--accent)', borderWidth: 1 }),
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position:        'absolute',
          top:             18,
          right:           18,
          width:           38,
          height:          38,
          borderRadius:    '50%',
          backgroundColor: iconBg,
          color:           iconColor,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
        }}
      >
        <Icon size={17} strokeWidth={1.75} />
      </div>

      <p className="label-caps" style={{ marginBottom: 8, paddingRight: 50 }}>{label}</p>
      <p
        className="font-display nums"
        style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.1, color: 'var(--text-primary)', marginBottom: 10 }}
      >
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1 }}>{sub}</p>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[0,1,2,3].map(i => (
          <div key={i} className="card" style={{ height: 120, backgroundColor: 'var(--bg-elevated)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[0,1,2,3].map(i => (
          <div key={i} className="card" style={{ height: 120, backgroundColor: 'var(--bg-elevated)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        ))}
      </div>
      <div className="card" style={{ height: 260, backgroundColor: 'var(--bg-elevated)', animation: 'pulse 1.5s ease-in-out infinite' }} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data,    setData]    = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    fetchAdminStats()
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSkeleton />

  if (error) {
    return (
      <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--danger)' }}>
        {error}
      </div>
    )
  }

  if (!data) return null

  return (
    <>
      {/* ══ Rang 1 — KPIs principaux ════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatCard
          label="Garages inscrits"
          value={String(data.totalGarages)}
          sub={`+${data.newGaragesThisMonth} ce mois`}
          icon={Building2}
          iconBg="var(--accent-muted)"
          iconColor="var(--accent)"
          highlight
        />
        <StatCard
          label="MRR plateforme"
          value={`${formatFCFA(data.mrrFcfa)} FCFA`}
          sub="factures payées ce mois"
          icon={Banknote}
          iconBg="var(--success-muted)"
          iconColor="var(--success)"
        />
        <StatCard
          label="Revenu total"
          value={`${formatFCFA(data.totalRevenueFcfa)} FCFA`}
          sub="depuis l'ouverture"
          icon={TrendingUp}
          iconBg="var(--success-muted)"
          iconColor="var(--success)"
        />
        <StatCard
          label="Interventions ce mois"
          value={String(data.interventionsThisMonth)}
          sub={`${data.totalInterventions} au total`}
          icon={Activity}
          iconBg="var(--accent-muted)"
          iconColor="var(--accent)"
        />
      </div>

      {/* ══ Rang 2 — KPIs utilisateurs & qualité ════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatCard
          label="Garagistes"
          value={String(data.totalGaragistes)}
          sub={`+${data.newGaragistesThisMonth} ce mois`}
          icon={UserCheck}
          iconBg="var(--warning-muted)"
          iconColor="var(--warning)"
        />
        <StatCard
          label="Clients"
          value={String(data.totalClients)}
          sub="comptes actifs"
          icon={Users}
          iconBg="var(--warning-muted)"
          iconColor="var(--warning)"
        />
        <StatCard
          label="Garages vérifiés"
          value={String(data.verifiedGarages)}
          sub={`${pct(data.verifiedGarages, data.totalGarages)} du total`}
          icon={BadgeCheck}
          iconBg="var(--success-muted)"
          iconColor="var(--success)"
        />
        <StatCard
          label="Total interventions"
          value={String(data.totalInterventions)}
          sub="toutes garages confondus"
          icon={Wrench}
          iconBg="var(--danger-muted)"
          iconColor="var(--danger)"
        />
      </div>

      {/* ══ Rang 3 — Derniers garages inscrits ══════════════════════════ */}
      <div className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
          <p className="label-caps">Acquisition</p>
          <h2 className="font-display" style={{ fontSize: 18, fontWeight: 400, color: 'var(--text-primary)', marginTop: 3, lineHeight: 1.2 }}>
            Derniers garages inscrits
          </h2>
        </div>

        {data.recentGarages.length === 0 ? (
          <p style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: 13 }}>
            Aucun garage enregistré pour l&apos;instant.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Garage', 'Ville', 'Propriétaire', 'Inscrit le', 'Statut'].map(h => (
                  <th
                    key={h}
                    style={{
                      padding:       '10px 20px',
                      textAlign:     'left',
                      fontSize:      11,
                      fontWeight:    600,
                      color:         'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      fontFamily:    'var(--font-body)',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recentGarages.map((g, i) => (
                <tr
                  key={g.id}
                  style={{
                    borderBottom: i < data.recentGarages.length - 1 ? '1px solid var(--border)' : 'none',
                    transition:   'background-color 120ms ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-elevated)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                >
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {g.name}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{g.city}</span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{g.ownerName}</span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className="nums" style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {g.createdAt}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span
                      style={{
                        display:         'inline-flex',
                        alignItems:      'center',
                        gap:             5,
                        fontSize:        11,
                        fontWeight:      600,
                        padding:         '3px 10px',
                        borderRadius:    20,
                        backgroundColor: g.verified ? 'var(--success-muted)' : 'var(--warning-muted)',
                        color:           g.verified ? 'var(--success)'       : 'var(--warning)',
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width:           5,
                          height:          5,
                          borderRadius:    '50%',
                          backgroundColor: g.verified ? 'var(--success)' : 'var(--warning)',
                          display:         'block',
                        }}
                      />
                      {g.verified ? 'Vérifié' : 'En attente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
