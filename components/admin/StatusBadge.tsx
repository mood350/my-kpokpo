'use client'

import type { InterventionStatus, AppointmentStatus } from '@/lib/mock-data'

// Union de tous les statuts possibles depuis le backend (MAJUSCULES, enum Java)
export type BadgeStatus = InterventionStatus | AppointmentStatus

interface StatusConfig {
  label: string
  cssClass: string   // correspond aux classes .badge-* dans globals.css
}

// Mapping statut backend → libellé FR + classe CSS
// Couvre InterventionStatus (IN_PROGRESS, ON_HOLD, COMPLETED)
// et AppointmentStatus (PENDING, CONFIRMED, REJECTED, RESCHEDULED, COMPLETED, CANCELLED)
const STATUS_MAP: Record<BadgeStatus, StatusConfig> = {
  // ── Interventions ──────────────────────────────────────────────────────────
  IN_PROGRESS:  { label: 'En cours',       cssClass: 'badge-in_progress' },
  ON_HOLD:      { label: 'En pause',        cssClass: 'badge-on_hold'     },

  // ── Commun (Intervention + Appointment) ────────────────────────────────────
  COMPLETED:    { label: 'Terminé',         cssClass: 'badge-completed'   },

  // ── Appointments ───────────────────────────────────────────────────────────
  PENDING:      { label: 'En attente',      cssClass: 'badge-pending'     },
  CONFIRMED:    { label: 'Confirmé',        cssClass: 'badge-confirmed'   },
  REJECTED:     { label: 'Refusé',          cssClass: 'badge-rejected'    },
  RESCHEDULED:  { label: 'Reprogrammé',     cssClass: 'badge-rescheduled' },
  CANCELLED:    { label: 'Annulé',          cssClass: 'badge-cancelled'   },
}

interface StatusBadgeProps {
  status: BadgeStatus
  /** Affiche un point coloré devant le label (utile dans les listes denses) */
  dot?: boolean
  className?: string
}

export default function StatusBadge({
  status,
  dot = false,
  className = '',
}: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? {
    label: status,
    cssClass: 'badge-cancelled',
  }

  return (
    <span className={`badge ${config.cssClass} ${className}`}>
      {dot && (
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: 5,
            height: 5,
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            flexShrink: 0,
          }}
        />
      )}
      {config.label}
    </span>
  )
}
