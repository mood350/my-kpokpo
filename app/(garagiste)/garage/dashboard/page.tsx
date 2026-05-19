'use client'

import { useState, useEffect } from 'react'
import {
  Wrench,
  Banknote,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react'
import {
  fetchDashboard,
  fetchReportDashboard,
  type DashboardData,
  type ReportDashboard,
} from '@/lib/api'
import { fetchMe } from '@/lib/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFCFA(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} M`
  if (value >= 1_000)     return `${(value / 1_000).toFixed(0)} k`
  return String(value)
}

const STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: 'En cours',
  ON_HOLD:     'En attente',
  COMPLETED:   'Terminée',
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  IN_PROGRESS: { bg: 'var(--accent-muted)',   color: 'var(--accent)'   },
  ON_HOLD:     { bg: 'var(--warning-muted)',  color: 'var(--warning)'  },
  COMPLETED:   { bg: 'var(--success-muted)',  color: 'var(--success)'  },
}

const APPT_STATUS_LABEL: Record<string, string> = {
  PENDING:     'En attente',
  CONFIRMED:   'Confirmé',
  REJECTED:    'Refusé',
  RESCHEDULED: 'Reporté',
  COMPLETED:   'Terminé',
  CANCELLED:   'Annulé',
}

const APPT_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING:     { bg: 'var(--warning-muted)',  color: 'var(--warning)'  },
  CONFIRMED:   { bg: 'var(--accent-muted)',   color: 'var(--accent)'   },
  COMPLETED:   { bg: 'var(--success-muted)',  color: 'var(--success)'  },
  REJECTED:    { bg: 'var(--danger-muted)',   color: 'var(--danger)'   },
  CANCELLED:   { bg: 'var(--danger-muted)',   color: 'var(--danger)'   },
  RESCHEDULED: { bg: 'var(--warning-muted)',  color: 'var(--warning)'  },
}

// ─── Composants ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label:     string
  value:     string
  sub?:      string
  icon:      LucideIcon
  iconColor: string
  iconBg:    string
  trend?:    number | null
  highlight?: boolean
}

function StatCard({ label, value, sub, icon: Icon, iconColor, iconBg, trend, highlight }: StatCardProps) {
  return (
    <div
      className="card card-hover animate-fade-in"
      style={{
        position:  'relative',
        minHeight: 120,
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
        style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.1, color: 'var(--text-primary)', marginBottom: 8 }}
      >
        {value}
      </p>

      {trend != null && (
        <span
          style={{
            display:    'inline-flex',
            alignItems: 'center',
            gap:        4,
            fontSize:   11,
            fontWeight: 600,
            color:      trend >= 0 ? 'var(--success)' : 'var(--danger)',
          }}
        >
          {trend >= 0
            ? <TrendingUp  size={12} strokeWidth={2} />
            : <TrendingDown size={12} strokeWidth={2} />}
          {trend >= 0 ? '+' : ''}{trend}% vs mois dernier
        </span>
      )}

      {sub && !trend && (
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ height: 280, backgroundColor: 'var(--bg-elevated)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div className="card" style={{ height: 280, backgroundColor: 'var(--bg-elevated)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
    </div>
  )
}

function StatusBadge({ status, map }: { status: string; map: Record<string, { bg: string; color: string }> }) {
  const c = map[status] ?? { bg: 'var(--bg-elevated)', color: 'var(--text-muted)' }
  return (
    <span
      style={{
        display:         'inline-flex',
        alignItems:      'center',
        gap:             5,
        fontSize:        11,
        fontWeight:      600,
        padding:         '3px 10px',
        borderRadius:    20,
        backgroundColor: c.bg,
        color:           c.color,
        whiteSpace:      'nowrap',
      }}
    >
      <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: c.color, display: 'block' }} />
      {status}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GaragisteDashboardPage() {
  const [dash,    setDash]    = useState<DashboardData | null>(null)
  const [report,  setReport]  = useState<ReportDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const me   = await fetchMe()
        const garageId = me.garageId
        if (!garageId) throw new Error('Aucun garage associé à ce compte.')

        const [d, r] = await Promise.all([
          fetchDashboard(),
          fetchReportDashboard(garageId),
        ])
        setDash(d)
        setReport(r)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <LoadingSkeleton />

  if (error) {
    return (
      <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--danger)' }}>
        {error}
      </div>
    )
  }

  if (!dash || !report) return null

  const { kpi, recentInterventions, todayAppointments, criticalStock } = dash

  return (
    <>
      {/* ══ KPIs ═════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatCard
          label="Interventions ce mois"
          value={String(kpi.interventionsThisMonth)}
          trend={kpi.interventionsTrend}
          icon={Wrench}
          iconBg="var(--accent-muted)"
          iconColor="var(--accent)"
          highlight
        />
        <StatCard
          label="Revenu ce mois"
          value={`${formatFCFA(kpi.revenueThisMonth)} FCFA`}
          trend={kpi.revenueTrend}
          icon={Banknote}
          iconBg="var(--success-muted)"
          iconColor="var(--success)"
        />
        <StatCard
          label="RDV en attente"
          value={String(kpi.pendingAppointments)}
          sub="à confirmer"
          icon={CalendarClock}
          iconBg="var(--warning-muted)"
          iconColor="var(--warning)"
        />
        <StatCard
          label="Alertes stock"
          value={String(kpi.stockAlerts)}
          sub={kpi.stockAlerts === 0 ? 'Stock OK' : 'pièces sous seuil'}
          icon={AlertTriangle}
          iconBg={kpi.stockAlerts > 0 ? 'var(--danger-muted)' : 'var(--success-muted)'}
          iconColor={kpi.stockAlerts > 0 ? 'var(--danger)' : 'var(--success)'}
        />
      </div>

      {/* ══ Rangée 2 — Interventions récentes + RDV du jour ═════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Interventions récentes */}
        <div className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
            <p className="label-caps">Activité</p>
            <h2 className="font-display" style={{ fontSize: 18, fontWeight: 400, color: 'var(--text-primary)', marginTop: 3, lineHeight: 1.2 }}>
              Interventions récentes
            </h2>
          </div>

          {recentInterventions.length === 0 ? (
            <p style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: 13 }}>
              Aucune intervention récente.
            </p>
          ) : (
            <div style={{ overflowY: 'auto', maxHeight: 320 }}>
              {recentInterventions.slice(0, 6).map((iv, i) => (
                <div
                  key={iv.id}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          12,
                    padding:      '12px 20px',
                    borderBottom: i < Math.min(recentInterventions.length, 6) - 1 ? '1px solid var(--border)' : 'none',
                    transition:   'background-color 120ms ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-elevated)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                >
                  <div
                    style={{
                      width:           32,
                      height:          32,
                      borderRadius:    8,
                      backgroundColor: 'var(--accent-muted)',
                      color:           'var(--accent)',
                      display:         'flex',
                      alignItems:      'center',
                      justifyContent:  'center',
                      flexShrink:      0,
                    }}
                  >
                    <Wrench size={14} strokeWidth={1.75} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {iv.vehicleBrand} {iv.vehicleModel}
                      <span className="nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                        {iv.vehicleLicensePlate}
                      </span>
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {iv.technicianName ?? 'Non assigné'} · {iv.interventionDate}
                    </p>
                  </div>
                  <StatusBadge status={STATUS_LABEL[iv.status] ?? iv.status} map={{
                    'En cours':   STATUS_COLORS.IN_PROGRESS,
                    'En attente': STATUS_COLORS.ON_HOLD,
                    'Terminée':   STATUS_COLORS.COMPLETED,
                  }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RDV du jour */}
        <div className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
            <p className="label-caps">Planning</p>
            <h2 className="font-display" style={{ fontSize: 18, fontWeight: 400, color: 'var(--text-primary)', marginTop: 3, lineHeight: 1.2 }}>
              Rendez-vous du jour
            </h2>
          </div>

          {todayAppointments.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              <CheckCircle2 size={28} strokeWidth={1.5} style={{ color: 'var(--success)', marginBottom: 8 }} />
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Aucun rendez-vous aujourd&apos;hui.</p>
            </div>
          ) : (
            <div style={{ overflowY: 'auto', maxHeight: 320 }}>
              {todayAppointments.slice(0, 6).map((ap, i) => (
                <div
                  key={ap.id}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          12,
                    padding:      '12px 20px',
                    borderBottom: i < Math.min(todayAppointments.length, 6) - 1 ? '1px solid var(--border)' : 'none',
                    transition:   'background-color 120ms ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-elevated)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                >
                  <div
                    style={{
                      width:           32,
                      height:          32,
                      borderRadius:    8,
                      backgroundColor: 'var(--warning-muted)',
                      color:           'var(--warning)',
                      display:         'flex',
                      alignItems:      'center',
                      justifyContent:  'center',
                      flexShrink:      0,
                    }}
                  >
                    <Clock size={14} strokeWidth={1.75} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ap.client.firstName} {ap.client.lastName}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ap.vehicle.brand} {ap.vehicle.model}
                      <span className="nums" style={{ fontFamily: 'var(--font-mono)', marginLeft: 5 }}>{ap.vehicle.licensePlate}</span>
                    </p>
                  </div>
                  <StatusBadge status={APPT_STATUS_LABEL[ap.status] ?? ap.status} map={{
                    'En attente': APPT_STATUS_COLORS.PENDING,
                    'Confirmé':   APPT_STATUS_COLORS.CONFIRMED,
                    'Terminé':    APPT_STATUS_COLORS.COMPLETED,
                    'Refusé':     APPT_STATUS_COLORS.REJECTED,
                    'Annulé':     APPT_STATUS_COLORS.CANCELLED,
                    'Reporté':    APPT_STATUS_COLORS.RESCHEDULED,
                  }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══ Rangée 3 — Résumé période + Alertes stock ═══════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Résumé période (depuis ReportDashboard) */}
        <div className="card animate-fade-in">
          <p className="label-caps" style={{ marginBottom: 16 }}>Résumé · {report.periodLabel}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Interventions totales',   value: String(report.totalInterventions)                          },
              { label: 'Interventions terminées', value: String(report.completedInterventions)                      },
              { label: 'Revenu TTC',              value: `${formatFCFA(report.totalRevenueTTC)} FCFA`               },
              { label: 'Coût moyen intervention', value: `${formatFCFA(report.averageInterventionCost)} FCFA`       },
              { label: 'Meilleur technicien',     value: report.topTechnician ?? '—'                               },
              { label: 'Maintenance à venir',     value: String(report.upcomingMaintenanceCount)                    },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{row.label}</span>
                <span className="nums" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Alertes stock critique */}
        <div className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
            <p className="label-caps">Stock</p>
            <h2 className="font-display" style={{ fontSize: 18, fontWeight: 400, color: 'var(--text-primary)', marginTop: 3, lineHeight: 1.2 }}>
              Pièces sous seuil
            </h2>
          </div>

          {criticalStock.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              <CheckCircle2 size={28} strokeWidth={1.5} style={{ color: 'var(--success)', marginBottom: 8 }} />
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Tous les stocks sont OK.</p>
            </div>
          ) : (
            <div style={{ overflowY: 'auto', maxHeight: 260 }}>
              {criticalStock.slice(0, 6).map((part, i) => (
                <div
                  key={part.id}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          12,
                    padding:      '11px 20px',
                    borderBottom: i < Math.min(criticalStock.length, 6) - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div
                    style={{
                      width:           32,
                      height:          32,
                      borderRadius:    8,
                      backgroundColor: 'var(--danger-muted)',
                      color:           'var(--danger)',
                      display:         'flex',
                      alignItems:      'center',
                      justifyContent:  'center',
                      flexShrink:      0,
                    }}
                  >
                    <AlertTriangle size={14} strokeWidth={1.75} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {part.name}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {part.category} · Réf. {part.reference}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p className="nums" style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
                      {part.currentStock} {part.unit}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>min {part.minStockThreshold}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
