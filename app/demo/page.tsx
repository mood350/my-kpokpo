'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import KpiCard     from '@/components/admin/KpiCard'
import StatusBadge from '@/components/admin/StatusBadge'
import {
  kpiData,
  revenueData,
  recentActivity,
  todayAppointments,
  criticalStock,
  formatFCFA,
  relativeTime,
  formatTime,
} from '@/lib/mock-data'
import { ArrowRight, FlaskConical } from 'lucide-react'

// ─── Sélecteur de période ─────────────────────────────────────────────────────

type Period = '3M' | '6M' | '12M'
const PERIODS: { label: Period; slice: number }[] = [
  { label: '3M',  slice: 3  },
  { label: '6M',  slice: 6  },
  { label: '12M', slice: 12 },
]

// ─── Tooltip Recharts personnalisé ────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?:  boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[]
  label?:   string
}) {
  if (!active || !payload?.length) return null
  const value = payload[0]?.value as number
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-elevated)',
        border:          '1px solid var(--border)',
        borderRadius:    10,
        padding:         '10px 14px',
        boxShadow:       'none',
      }}
    >
      <p
        style={{
          fontSize:      11,
          color:         'var(--text-secondary)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom:  4,
          fontFamily:    'var(--font-body)',
        }}
      >
        {label}
      </p>
      <p
        className="font-display nums"
        style={{ fontSize: 17, fontWeight: 500, color: 'var(--text-primary)' }}
      >
        {formatFCFA(value)}{' '}
        <span
          style={{
            fontSize:   11,
            fontWeight: 400,
            color:      'var(--text-secondary)',
            fontFamily: 'var(--font-body)',
          }}
        >
          FCFA
        </span>
      </p>
    </div>
  )
}

// ─── Page Démo ────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [period, setPeriod] = useState<Period>('12M')

  const selectedPeriod = PERIODS.find(p => p.label === period)!
  const chartData      = revenueData.slice(-selectedPeriod.slice)

  return (
    <main
      style={{
        minHeight:       '100vh',
        backgroundColor: 'var(--bg-base)',
        padding:         '28px 28px 40px',
        display:         'flex',
        flexDirection:   'column',
        gap:             24,
        maxWidth:        1280,
        margin:          '0 auto',
      }}
    >
      {/* ── Bannière mode démo ──────────────────────────────────────── */}
      <div
        style={{
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'space-between',
          gap:             16,
          padding:         '12px 20px',
          borderRadius:    10,
          backgroundColor: 'var(--accent-muted)',
          border:          '1px solid rgba(168,130,62,0.28)',
          flexWrap:        'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FlaskConical
            size={16}
            strokeWidth={1.75}
            style={{ color: 'var(--accent)', flexShrink: 0 }}
          />
          <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500, lineHeight: 1.4 }}>
            Mode démo — toutes les données sont fictives et ne reflètent pas un garage réel.
          </p>
        </div>
        <Link
          href="/register"
          style={{
            display:         'flex',
            alignItems:      'center',
            gap:             5,
            fontSize:        12,
            fontWeight:      600,
            color:           '#FFF',
            backgroundColor: 'var(--accent)',
            padding:         '6px 14px',
            borderRadius:    7,
            textDecoration:  'none',
            flexShrink:      0,
            transition:      'opacity 150ms ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.85' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
        >
          Créer mon compte <ArrowRight size={12} strokeWidth={2} />
        </Link>
      </div>

      {/* ══ Rang 1 — KPI Cards ══════════════════════════════════════════ */}
      <div
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap:                 20,
        }}
      >
        {kpiData.map(kpi => (
          <KpiCard key={kpi.id} data={kpi} />
        ))}
      </div>

      {/* ══ Rang 2 — Graphique CA + Activité récente ════════════════════ */}
      <div
        style={{
          display:             'grid',
          gridTemplateColumns: '2fr 1fr',
          gap:                 20,
          alignItems:          'start',
        }}
      >
        {/* ── Graphique CA ───────────────────────────────────────────── */}
        <div
          className="card animate-fade-in"
          style={{ padding: 0, overflow: 'hidden' }}
        >
          <div
            style={{
              padding:        '20px 24px 0',
              display:        'flex',
              alignItems:     'flex-start',
              justifyContent: 'space-between',
              marginBottom:   20,
            }}
          >
            <div>
              <p className="label-caps">Chiffre d&apos;affaires</p>
              <h2
                className="font-display"
                style={{
                  fontSize:   18,
                  fontWeight: 400,
                  color:      'var(--text-primary)',
                  marginTop:  3,
                  lineHeight: 1.2,
                }}
              >
                Évolution mensuelle
              </h2>
            </div>

            <div
              style={{
                display:         'flex',
                gap:             2,
                backgroundColor: 'var(--bg-elevated)',
                borderRadius:    8,
                padding:         3,
                flexShrink:      0,
              }}
            >
              {PERIODS.map(({ label }) => {
                const active = period === label
                return (
                  <button
                    key={label}
                    onClick={() => setPeriod(label)}
                    style={{
                      padding:         '4px 12px',
                      borderRadius:    6,
                      border:          'none',
                      fontSize:        12,
                      fontWeight:      active ? 600 : 400,
                      cursor:          'pointer',
                      backgroundColor: active ? 'var(--bg-surface)' : 'transparent',
                      color:           active ? 'var(--accent)' : 'var(--text-secondary)',
                      fontFamily:      'var(--font-body)',
                      transition:      'background-color 150ms ease, color 150ms ease',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={chartData}
              margin={{ top: 0, right: 24, left: -4, bottom: 0 }}
            >
              <defs>
                <linearGradient id="caGradientDemo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  style={{ stopColor: 'var(--accent)', stopOpacity: 0.28 }} />
                  <stop offset="95%" style={{ stopColor: 'var(--accent)', stopOpacity: 0 }} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />

              <XAxis
                dataKey="mois"
                tick={{ fontSize: 11, fill: 'var(--text-muted)' as string, fontFamily: 'var(--font-body)' }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />

              <YAxis
                tickFormatter={(v: number) => v === 0 ? '0' : `${Math.round(v / 1000)}k`}
                tick={{ fontSize: 11, fill: 'var(--text-muted)' as string, fontFamily: 'var(--font-body)' }}
                axisLine={false}
                tickLine={false}
                width={44}
              />

              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
              />

              <Area
                type="monotone"
                dataKey="ca"
                stroke="var(--accent)"
                strokeWidth={1.5}
                fill="url(#caGradientDemo)"
                dot={false}
                activeDot={{ r: 4, fill: 'var(--accent)', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          <div
            style={{
              padding:    '12px 24px 20px',
              borderTop:  '1px solid var(--border)',
              display:    'flex',
              alignItems: 'center',
              gap:        16,
            }}
          >
            <div>
              <p className="label-caps" style={{ marginBottom: 2 }}>Total période</p>
              <p
                className="font-display nums"
                style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1 }}
              >
                {formatFCFA(chartData.reduce((acc, d) => acc + d.ca, 0))}{' '}
                <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                  FCFA
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* ── Activité récente ────────────────────────────────────────── */}
        <div className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
            <p className="label-caps">Activité récente</p>
            <h2
              className="font-display"
              style={{ fontSize: 18, fontWeight: 400, color: 'var(--text-primary)', marginTop: 3, lineHeight: 1.2 }}
            >
              Dernières interventions
            </h2>
          </div>

          <div>
            {recentActivity.map((item, i) => (
              <div
                key={item.id}
                style={{
                  display:      'flex',
                  alignItems:   'flex-start',
                  gap:          12,
                  padding:      '13px 20px',
                  borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <span
                  aria-label={item.technicianName}
                  title={item.technicianName}
                  style={{
                    display:         'flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                    width:           30,
                    height:          30,
                    borderRadius:    '50%',
                    backgroundColor: item.technicianColor,
                    color:           '#FFFFFF',
                    fontSize:        11,
                    fontWeight:      600,
                    flexShrink:      0,
                    letterSpacing:   '0.02em',
                  }}
                >
                  {item.technicianInitials}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span
                      style={{
                        fontFamily:    'var(--font-mono)',
                        fontSize:      12,
                        fontWeight:    600,
                        color:         'var(--text-primary)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {item.vehicleLicensePlate}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>
                      {relativeTime(item.createdAt)}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.workDescription}
                  </p>
                  <StatusBadge status={item.status} dot />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ Rang 3 — RDV du jour + Stock critique ═══════════════════════ */}
      <div
        style={{
          display:             'grid',
          gridTemplateColumns: '1fr 1fr',
          gap:                 20,
          alignItems:          'start',
        }}
      >
        {/* ── RDV du jour ─────────────────────────────────────────────── */}
        <div className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
            <p className="label-caps">Agenda</p>
            <h2 className="font-display" style={{ fontSize: 18, fontWeight: 400, color: 'var(--text-primary)', marginTop: 3, lineHeight: 1.2 }}>
              RDV du jour
            </h2>
          </div>

          <div style={{ padding: '4px 0 8px' }}>
            {todayAppointments.map((appt, i) => (
              <div
                key={appt.id}
                style={{
                  display:      'flex',
                  gap:          14,
                  padding:      '12px 20px',
                  borderBottom: i < todayAppointments.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 6 }}>
                  <span
                    aria-hidden="true"
                    style={{
                      width:           8,
                      height:          8,
                      borderRadius:    '50%',
                      backgroundColor: appt.status === 'CONFIRMED' ? 'var(--accent)' : 'var(--border)',
                      flexShrink:      0,
                      display:         'block',
                    }}
                  />
                  {i < todayAppointments.length - 1 && (
                    <span
                      aria-hidden="true"
                      style={{ width: 1, flex: 1, backgroundColor: 'var(--border)', marginTop: 5, minHeight: 24, display: 'block' }}
                    />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                      <span className="font-display" style={{ fontSize: 15, fontWeight: 400, color: 'var(--text-primary)', lineHeight: 1 }}>
                        {formatTime(appt.requestedDate)}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {appt.client.firstName} {appt.client.lastName}
                      </span>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>

                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.04em', marginBottom: appt.clientNotes ? 8 : 0 }}>
                    {appt.vehicle.brand} {appt.vehicle.model}
                    {'  ·  '}
                    {appt.vehicle.licensePlate}
                  </p>

                  {appt.clientNotes && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: appt.status === 'PENDING' ? 8 : 0, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      &ldquo;{appt.clientNotes}&rdquo;
                    </p>
                  )}

                  {appt.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-accent" style={{ fontSize: 11, padding: '4px 10px' }}>Confirmer</button>
                      <button className="btn-ghost"  style={{ fontSize: 11, padding: '4px 10px' }}>Voir</button>
                    </div>
                  )}
                  {appt.status === 'CONFIRMED' && (
                    <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}>Voir détails</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stock critique ──────────────────────────────────────────── */}
        <div className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
            <p className="label-caps">Stocks</p>
            <h2 className="font-display" style={{ fontSize: 18, fontWeight: 400, color: 'var(--text-primary)', marginTop: 3, lineHeight: 1.2 }}>
              Pièces critiques
            </h2>
          </div>

          <div>
            {criticalStock.map((item, i) => {
              const ratio    = item.currentStock / item.minStockThreshold
              const barColor = ratio < 0.2 ? 'var(--danger)' : ratio < 0.5 ? 'var(--warning)' : 'var(--success)'
              const pluralize = (n: number, unit: string) => n > 1 && !unit.endsWith('s') ? `${unit}s` : unit

              return (
                <div
                  key={item.id}
                  style={{
                    padding:      '16px 24px',
                    borderBottom: i < criticalStock.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                        {item.reference}
                      </p>
                    </div>
                    <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px', flexShrink: 0 }}>
                      Réapprovisionner
                    </button>
                  </div>

                  <div style={{ height: 4, backgroundColor: 'var(--bg-elevated)', borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
                    <div
                      style={{
                        width:           `${Math.min(ratio * 100, 100)}%`,
                        height:          '100%',
                        backgroundColor: barColor,
                        borderRadius:    2,
                        transition:      'width 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="nums" style={{ fontSize: 12, color: barColor, fontWeight: 600 }}>
                      {item.currentStock}{' '}
                      <span style={{ fontWeight: 400 }}>{pluralize(item.currentStock, item.unit)}</span>
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      seuil min.{' '}
                      <span className="nums">{item.minStockThreshold}</span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
