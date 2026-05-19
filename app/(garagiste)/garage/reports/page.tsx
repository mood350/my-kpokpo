'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle, RefreshCw, TrendingUp, Wrench,
  CalendarClock, Package, Users, Car,
} from 'lucide-react'
import {
  fetchMe,
  fetchReportDashboard,
  fetchReportRevenue,
  fetchTopServices,
  fetchUpcomingMaintenance,
  type ReportDashboard,
  type RevenueReport,
  type TopService,
  type UpcomingMaintenance,
} from '@/lib/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(n: number): string {
  return n.toLocaleString('fr-FR') + ' F CFA'
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function expiryColor(iso: string | null): string {
  if (!iso) return 'var(--text-muted)'
  const diff = (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  if (diff < 0)  return '#ef4444'
  if (diff < 30) return '#f59e0b'
  return 'var(--text-secondary)'
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon:  React.ElementType
  label: string
  value: string | number
  sub?:  string
  color: string
}) {
  return (
    <div style={{
      display:         'flex',
      flexDirection:   'column',
      gap:             12,
      padding:         '18px 20px',
      backgroundColor: 'var(--bg-surface)',
      border:          '1px solid var(--border)',
      borderRadius:    12,
      flex:            '1 1 180px',
      minWidth:        0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 9, backgroundColor: `${color}18`, flexShrink: 0 }}>
          <Icon size={16} strokeWidth={1.75} style={{ color }} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      </div>
      <div>
        <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{sub}</p>}
      </div>
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
      {title}
    </p>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GaragisteReportsPage() {
  const router = useRouter()

  const [dashboard,   setDashboard]   = useState<ReportDashboard | null>(null)
  const [revenue,     setRevenue]     = useState<RevenueReport | null>(null)
  const [topServices, setTopServices] = useState<TopService[]>([])
  const [upcoming,    setUpcoming]    = useState<UpcomingMaintenance[]>([])
  const [loading,     setLoading]     = useState(true)
  const [fetchError,  setFetchError]  = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setFetchError(null)
    try {
      const me = await fetchMe()
      if (!me.garageId) { setFetchError('Aucun garage associé à votre compte.'); return }
      const gid = me.garageId

      const [dash, rev, top, up] = await Promise.all([
        fetchReportDashboard(gid),
        fetchReportRevenue(gid).catch(() => null),
        fetchTopServices(gid).catch(() => [] as TopService[]),
        fetchUpcomingMaintenance(gid).catch(() => [] as UpcomingMaintenance[]),
      ])

      setDashboard(dash)
      setRevenue(rev)
      setTopServices(top)
      setUpcoming(up)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue'
      if (msg.includes('401')) { router.push('/login?redirect=/garage/reports'); return }
      setFetchError(msg)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ flex: '1 1 180px', height: 110, borderRadius: 12, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
          ))}
        </div>
        <div style={{ height: 200, borderRadius: 12, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 64, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, textAlign: 'center' }}>
        <AlertTriangle size={32} strokeWidth={1.5} style={{ color: 'var(--danger)' }} />
        <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{fetchError}</p>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 7, border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          <RefreshCw size={13} /> Réessayer
        </button>
      </div>
    )
  }

  if (!dashboard) return null

  const maxRevenue = Math.max(...topServices.map(s => Number(s.totalRevenue)), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, padding: '0 2px' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h2 className="font-display" style={{ fontSize: 22, fontWeight: 400, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Statistiques
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            {dashboard.periodLabel}
          </p>
        </div>
        <button onClick={load} title="Actualiser" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <RefreshCw size={15} strokeWidth={1.75} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard
          icon={TrendingUp}
          label="Chiffre d'affaires TTC"
          value={fmtCurrency(dashboard.totalRevenueTTC)}
          sub={revenue ? `${revenue.paidInvoiceCount} facture${revenue.paidInvoiceCount > 1 ? 's' : ''} payée${revenue.paidInvoiceCount > 1 ? 's' : ''}` : undefined}
          color="var(--accent)"
        />
        <KpiCard
          icon={Wrench}
          label="Interventions"
          value={dashboard.totalInterventions}
          sub={`${dashboard.completedInterventions} terminées`}
          color="#3b82f6"
        />
        <KpiCard
          icon={CalendarClock}
          label="RDV en attente"
          value={dashboard.pendingAppointments}
          color="#f59e0b"
        />
        <KpiCard
          icon={Package}
          label="Alertes stock"
          value={dashboard.stockAlerts}
          color={dashboard.stockAlerts > 0 ? '#ef4444' : '#10b981'}
        />
        {dashboard.topTechnician && (
          <KpiCard
            icon={Users}
            label="Meilleur technicien"
            value={dashboard.topTechnician}
            color="#6366f1"
          />
        )}
        <KpiCard
          icon={Car}
          label="Maintenances à venir"
          value={dashboard.upcomingMaintenanceCount}
          color="#8b5cf6"
        />
      </div>

      {revenue && (
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
          <SectionHeader title="Chiffre d'affaires" />
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[
              { label: 'Total HT',  value: fmtCurrency(revenue.totalRevenueHT) },
              { label: 'Total TTC', value: fmtCurrency(revenue.totalRevenueTTC) },
              { label: 'Factures payées', value: revenue.paidInvoiceCount },
            ].map((item, i) => (
              <div key={i}>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{item.label}</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginTop: 4 }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
          <SectionHeader title="Top services" />
          {topServices.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Aucune donnée disponible.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topServices.slice(0, 8).map((s, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{s.description}</span>
                    <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>{s.usageCount}×</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, backgroundColor: 'var(--bg-elevated)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 2, backgroundColor: 'var(--accent)', width: `${(Number(s.totalRevenue) / maxRevenue) * 100}%`, transition: 'width 600ms ease' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
          <SectionHeader title="Maintenances à venir (30 j)" />
          {upcoming.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Aucune échéance imminente.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {upcoming.slice(0, 8).map((m, i) => (
                <div key={m.vehicleId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < upcoming.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.brand} {m.model} — {m.licensePlate}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>{m.ownerName}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                    {m.insuranceExpiry && (
                      <p style={{ fontSize: 11, color: expiryColor(m.insuranceExpiry) }}>
                        Assurance : {fmtDate(m.insuranceExpiry)}
                      </p>
                    )}
                    {m.technicalInspectionExpiry && (
                      <p style={{ fontSize: 11, color: expiryColor(m.technicalInspectionExpiry) }}>
                        CT : {fmtDate(m.technicalInspectionExpiry)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
