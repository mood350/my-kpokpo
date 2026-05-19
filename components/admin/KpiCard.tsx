'use client'

import {
  TrendingUp,
  TrendingDown,
  TriangleAlert,
  Wrench,
  Banknote,
  CalendarClock,
  Package,
  type LucideIcon,
} from 'lucide-react'
import type { KpiData, KpiIconType, KpiColorVariant } from '@/lib/mock-data'

// ─── Mappings ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<KpiIconType, LucideIcon> = {
  interventions: Wrench,
  revenue:       Banknote,
  appointments:  CalendarClock,
  stock:         Package,
}

const VARIANT_STYLE: Record<
  KpiColorVariant,
  { iconBg: string; iconColor: string }
> = {
  accent:  { iconBg: 'var(--accent-muted)',  iconColor: 'var(--accent)'  },
  success: { iconBg: 'var(--success-muted)', iconColor: 'var(--success)' },
  warning: { iconBg: 'var(--warning-muted)', iconColor: 'var(--warning)' },
  danger:  { iconBg: 'var(--danger-muted)',  iconColor: 'var(--danger)'  },
}

// ─── Composant ───────────────────────────────────────────────────────────────

interface KpiCardProps {
  data: KpiData
}

export default function KpiCard({ data }: KpiCardProps) {
  const { label, value, trend, subLabel, iconType, colorVariant } = data

  const Icon                  = ICON_MAP[iconType]
  const { iconBg, iconColor } = VARIANT_STYLE[colorVariant]

  const isPositive = trend !== null && trend > 0
  const isNegative = trend !== null && trend < 0
  const trendColor = isPositive
    ? 'var(--success)'
    : isNegative
    ? 'var(--danger)'
    : 'var(--text-secondary)'

  return (
    <div
      className="card card-hover animate-fade-in"
      style={{ position: 'relative', minHeight: 128 }}
    >
      {/* ── Icône — cercle en haut à droite ──────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position:        'absolute',
          top:             20,
          right:           20,
          width:           40,
          height:          40,
          borderRadius:    '50%',
          backgroundColor: iconBg,
          color:           iconColor,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          flexShrink:      0,
        }}
      >
        <Icon size={18} strokeWidth={1.75} />
      </div>

      {/* ── Label ────────────────────────────────────────────────────── */}
      <p
        className="label-caps"
        style={{ marginBottom: 10, paddingRight: 52 }}
      >
        {label}
      </p>

      {/* ── Valeur principale ────────────────────────────────────────── */}
      <p
        className="font-display nums"
        style={{
          fontSize:    32,
          fontWeight:  500,
          lineHeight:  1.1,
          color:       'var(--text-primary)',
          marginBottom: 14,
          paddingRight: 52,  /* évite le chevauchement avec l'icône */
        }}
      >
        {value}
      </p>

      {/* ── Ligne tendance / statut ───────────────────────────────────── */}
      {trend !== null ? (
        /* Cas A — tendance chiffrée (interventions, CA) */
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {isNegative ? (
            <TrendingDown
              size={13}
              strokeWidth={2}
              style={{ color: 'var(--danger)', flexShrink: 0 }}
            />
          ) : (
            <TrendingUp
              size={13}
              strokeWidth={2}
              style={{ color: 'var(--success)', flexShrink: 0 }}
            />
          )}
          <span
            style={{
              fontSize:           12,
              fontWeight:         600,
              color:              trendColor,
              fontVariantNumeric: 'tabular-nums',
              lineHeight:         1,
            }}
          >
            {isPositive ? '+' : ''}
            {trend}%
          </span>
          <span
            style={{
              fontSize: 12,
              color:    'var(--text-secondary)',
              lineHeight: 1,
            }}
          >
            {subLabel}
          </span>
        </div>
      ) : colorVariant === 'danger' ? (
        /* Cas B — alerte (stock critique) */
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <TriangleAlert
            size={13}
            strokeWidth={2}
            style={{ color: 'var(--danger)', flexShrink: 0 }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {subLabel}
          </span>
        </div>
      ) : (
        /* Cas C — statut en attente (RDV à confirmer) */
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span
            aria-hidden="true"
            style={{
              display:         'inline-block',
              width:           6,
              height:          6,
              borderRadius:    '50%',
              backgroundColor: 'var(--warning)',
              flexShrink:      0,
            }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {subLabel}
          </span>
        </div>
      )}
    </div>
  )
}
