'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarClock, Search, AlertTriangle, RefreshCw, Loader2,
  CheckCircle, XCircle, Clock, Ban, ChevronDown, Plus, X,
} from 'lucide-react'
import {
  authHeaders, fetchMe, fetchAppointmentsByGarage,
  type AppointmentResponse, type AppointmentStatus,
} from '@/lib/api'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING:     'En attente',
  CONFIRMED:   'Confirmé',
  REJECTED:    'Refusé',
  RESCHEDULED: 'Reprogrammé',
  COMPLETED:   'Terminé',
  CANCELLED:   'Annulé',
}

const STATUS_COLORS: Record<AppointmentStatus, { bg: string; color: string }> = {
  PENDING:     { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  CONFIRMED:   { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
  REJECTED:    { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
  RESCHEDULED: { bg: 'rgba(99,102,241,0.12)',  color: '#6366f1' },
  COMPLETED:   { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
  CANCELLED:   { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' },
}

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

const labelStyle: React.CSSProperties = {
  fontSize:      11,
  fontWeight:    600,
  color:         'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { bg, color } = STATUS_COLORS[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 8px', borderRadius: 11, backgroundColor: bg, color, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {STATUS_LABELS[status]}
    </span>
  )
}

function actionBtnStyle(color: string): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    height: 34, padding: '0 14px', borderRadius: 7,
    border: 'none', backgroundColor: color, color: '#fff',
    fontSize: 12, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
  }
}

interface CreateModalProps {
  garageId: number
  onClose:  () => void
  onCreate: (appt: AppointmentResponse) => void
}

function CreateModal({ garageId, onClose, onCreate }: CreateModalProps) {
  const router = useRouter()

  const [vehicleId, setVehicleId] = useState('')
  const [date,      setDate]      = useState('')
  const [time,      setTime]      = useState('09:00')
  const [notes,     setNotes]     = useState('')
  const [saving,    setSaving]    = useState(false)
  const [err,       setErr]       = useState<string | null>(null)

  async function handleCreate() {
    setErr(null)
    if (!vehicleId || !date || !time) {
      setErr('Le véhicule, la date et l\'heure sont obligatoires.'); return
    }

    setSaving(true)
    try {
      const res = await fetch(`${API}/api/v1/appointments`, {
        method:  'POST',
        headers: authHeaders(),
        body:    JSON.stringify({
          vehicleId:     Number(vehicleId),
          garageId,
          requestedDate: `${date}T${time}:00`,
          clientNotes:   notes.trim() || undefined,
        }),
      })
      if (res.status === 401) { router.push('/login'); return }
      if (!res.ok) {
        const b = await res.json().catch(() => ({})) as { message?: string }
        setErr(b.message ?? `Erreur ${res.status}`); return
      }
      onCreate(await res.json() as AppointmentResponse)
    } catch {
      setErr('Impossible de contacter le serveur.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card" style={{ maxWidth: 460 }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Nouveau rendez-vous</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>ID du véhicule *</label>
            <input
              type="number" min="1"
              value={vehicleId}
              onChange={e => setVehicleId(e.target.value)}
              style={inputStyle} className="form-input"
              placeholder="Ex. : 12"
            />
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              L&apos;ID se trouve dans la page Véhicules.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} className="form-input" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Heure *</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} className="form-input" />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Détails de la demande…"
              style={{ ...inputStyle, height: 'auto', padding: '8px 10px', resize: 'vertical' }}
              className="form-input"
            />
          </div>

          {err && <p style={{ fontSize: 12, color: 'var(--danger)' }}>{err}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
            <button onClick={onClose} style={{ height: 38, padding: '0 16px', borderRadius: 7, border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              Annuler
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 20px', borderRadius: 7, border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'var(--font-body)' }}
            >
              {saving && <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />}
              Créer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ActionModalProps {
  appt:     AppointmentResponse
  onClose:  () => void
  onUpdate: (updated: AppointmentResponse) => void
}

function ActionModal({ appt, onClose, onUpdate }: ActionModalProps) {
  const router              = useRouter()
  const [busy, setBusy]     = useState(false)
  const [note, setNote]     = useState('')
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [err, setErr]       = useState<string | null>(null)

  async function act(action: string, body?: Record<string, unknown>) {
    setBusy(true); setErr(null)
    try {
      const res = await fetch(`${API}/api/v1/appointments/${appt.id}/${action}`, {
        method:  'PUT',
        headers: authHeaders(),
        body:    JSON.stringify(body ?? {}),
      })
      if (res.status === 401) { router.push('/login'); return }
      if (!res.ok) {
        const b = await res.json().catch(() => ({})) as { message?: string }
        setErr(b.message ?? `Erreur ${res.status}`)
        return
      }
      onUpdate(await res.json() as AppointmentResponse)
    } catch {
      setErr('Impossible de contacter le serveur.')
    } finally {
      setBusy(false)
    }
  }

  function handleReschedule() {
    if (!newDate || !newTime) { setErr('Sélectionnez une date et une heure.'); return }
    act('reschedule', { newDate: `${newDate}T${newTime}:00`, garageNotes: note || undefined })
  }

  const canConfirm    = appt.status === 'PENDING'
  const canReject     = appt.status === 'PENDING'
  const canReschedule = appt.status === 'PENDING' || appt.status === 'CONFIRMED'
  const canComplete   = appt.status === 'CONFIRMED'
  const canCancel     = appt.status === 'PENDING'  || appt.status === 'CONFIRMED'

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card" style={{ maxWidth: 500 }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
            Rendez-vous #{appt.id}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <p style={labelStyle}>Client</p>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>
                {appt.client.firstName} {appt.client.lastName}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{appt.client.email}</p>
            </div>
            <div>
              <p style={labelStyle}>Véhicule</p>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>
                {appt.vehicle.brand} {appt.vehicle.model}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{appt.vehicle.licensePlate}</p>
            </div>
            <div>
              <p style={labelStyle}>Date demandée</p>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>
                {formatDateTime(appt.requestedDate)}
              </p>
            </div>
            <div>
              <p style={labelStyle}>Statut</p>
              <div style={{ marginTop: 4 }}><StatusBadge status={appt.status} /></div>
            </div>
            {appt.clientNotes && (
              <div style={{ gridColumn: '1/-1' }}>
                <p style={labelStyle}>Notes client</p>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>{appt.clientNotes}</p>
              </div>
            )}
          </div>

          {(canConfirm || canReject || canReschedule) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={labelStyle}>Note garage (optionnel)</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                placeholder="Message au client…"
                style={{ ...inputStyle, height: 'auto', padding: '8px 10px', resize: 'vertical' }}
              />
            </div>
          )}

          {canReschedule && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={labelStyle}>Nouvelle date</label>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={inputStyle} className="form-input" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={labelStyle}>Heure</label>
                <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} style={inputStyle} className="form-input" />
              </div>
            </div>
          )}

          {err && <p style={{ fontSize: 12, color: 'var(--danger)' }}>{err}</p>}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {canConfirm && (
              <button onClick={() => act('confirm', { garageNotes: note || undefined })} disabled={busy} style={actionBtnStyle('var(--accent)')}>
                <CheckCircle size={13} /> Confirmer
              </button>
            )}
            {canComplete && (
              <button onClick={() => act('complete')} disabled={busy} style={actionBtnStyle('#10b981')}>
                <CheckCircle size={13} /> Terminer
              </button>
            )}
            {canReschedule && (
              <button onClick={handleReschedule} disabled={busy} style={actionBtnStyle('#6366f1')}>
                <Clock size={13} /> Reprogrammer
              </button>
            )}
            {canReject && (
              <button onClick={() => act('reject', { garageNotes: note || undefined })} disabled={busy} style={actionBtnStyle('#ef4444')}>
                <XCircle size={13} /> Refuser
              </button>
            )}
            {canCancel && (
              <button onClick={() => act('cancel')} disabled={busy} style={actionBtnStyle('#6b7280')}>
                <Ban size={13} /> Annuler
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GaragisteAppointmentsPage() {
  const router = useRouter()

  const [appts,        setAppts]        = useState<AppointmentResponse[]>([])
  const [garageId,     setGarageId]     = useState<number | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [fetchError,   setFetchError]   = useState<string | null>(null)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'ALL'>('ALL')
  const [selected,     setSelected]     = useState<AppointmentResponse | null>(null)
  const [showCreate,   setShowCreate]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setFetchError(null)
    try {
      const me = await fetchMe()
      if (!me.garageId) { setFetchError('Aucun garage associé à votre compte.'); return }
      setGarageId(me.garageId)
      const list = await fetchAppointmentsByGarage(me.garageId)
      setAppts(list)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue'
      if (msg.includes('401')) { router.push('/login?redirect=/garage/appointments'); return }
      setFetchError(msg)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSelected(null); setShowCreate(false) }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  const q = search.toLowerCase().trim()
  const filtered = appts.filter(a => {
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter
    const matchSearch = !q || [
      a.client.firstName, a.client.lastName, a.client.email,
      a.vehicle.brand, a.vehicle.model, a.vehicle.licensePlate,
    ].some(s => s.toLowerCase().includes(q))
    return matchStatus && matchSearch
  })

  function handleUpdate(updated: AppointmentResponse) {
    setAppts(prev => prev.map(a => a.id === updated.id ? updated : a))
    setSelected(updated)
  }

  const statusCounts = (['PENDING', 'CONFIRMED', 'COMPLETED'] as AppointmentStatus[]).map(s => ({
    status: s,
    count:  appts.filter(a => a.status === s).length,
  }))

  return (
    <>
      <style>{`
        .appt-row:hover { background-color: var(--bg-elevated); }
        .action-btn { opacity: 0; transition: opacity 150ms ease; }
        .appt-row:hover .action-btn { opacity: 1; }
        .modal-overlay {
          position: fixed; inset: 0; z-index: 50;
          background: rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .modal-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          width: 100%; max-width: 580px;
          max-height: 90vh; overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
        }
        .form-input:focus { border-color: var(--accent) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 2px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 className="font-display" style={{ fontSize: 22, fontWeight: 400, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Rendez-vous
              </h2>
              {!loading && !fetchError && (
                <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 8px', borderRadius: 11, backgroundColor: 'var(--accent-muted)', color: 'var(--accent)', fontSize: 12, fontWeight: 600 }}>
                  {appts.length}
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              Gérez les demandes de rendez-vous de vos clients.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', borderRadius: 8, border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--font-body)' }}
          >
            <Plus size={15} strokeWidth={2} />
            Nouveau rendez-vous
          </button>
        </div>

        {!loading && !fetchError && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {statusCounts.map(({ status, count }) => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: STATUS_COLORS[status].color }}>{count}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{STATUS_LABELS[status]}{count !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={14} strokeWidth={1.75} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher client, véhicule…"
              style={{ ...inputStyle, paddingLeft: 32 }} className="form-input"
            />
          </div>
          <div style={{ position: 'relative' }}>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as AppointmentStatus | 'ALL')}
              style={{ ...inputStyle, width: 'auto', paddingRight: 32, appearance: 'none' }}
              className="form-input"
            >
              <option value="ALL">Tous les statuts</option>
              {(Object.keys(STATUS_LABELS) as AppointmentStatus[]).map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
          </div>
        </div>

        {loading ? (
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 20px', borderBottom: i < 4 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
                {[140, 110, 100, 90, 80].map((w, j) => (
                  <div key={j} style={{ height: 14, width: w, borderRadius: 4, backgroundColor: 'var(--bg-elevated)', flexShrink: 0 }} />
                ))}
              </div>
            ))}
          </div>
        ) : fetchError ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 48, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, textAlign: 'center' }}>
            <AlertTriangle size={32} strokeWidth={1.5} style={{ color: 'var(--danger)' }} />
            <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{fetchError}</p>
            <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 7, border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              <RefreshCw size={13} /> Réessayer
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 64, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
            <CalendarClock size={36} strokeWidth={1.2} style={{ color: 'var(--text-muted)' }} />
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
              {search || statusFilter !== 'ALL' ? 'Aucun résultat' : 'Aucun rendez-vous'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {search || statusFilter !== 'ALL' ? 'Modifiez vos filtres.' : 'Les demandes de vos clients apparaîtront ici.'}
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr auto', gap: 16, padding: '10px 20px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)' }}>
              {['Client', 'Véhicule', 'Date demandée', 'Statut', ''].map((h, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
              ))}
            </div>

            {filtered.map((appt, idx) => (
              <div
                key={appt.id}
                className="appt-row"
                style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr auto', gap: 16, padding: '13px 20px', borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', cursor: 'pointer', transition: 'background-color 150ms ease' }}
                onClick={() => setSelected(appt)}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {appt.client.firstName} {appt.client.lastName}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>{appt.client.email}</p>
                </div>
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    {appt.vehicle.brand} {appt.vehicle.model}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>{appt.vehicle.licensePlate}</p>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {formatDateTime(appt.requestedDate)}
                </p>
                <StatusBadge status={appt.status} />
                <button
                  className="action-btn"
                  onClick={e => { e.stopPropagation(); setSelected(appt) }}
                  style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}
                >
                  Gérer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && garageId && (
        <CreateModal
          garageId={garageId}
          onClose={() => setShowCreate(false)}
          onCreate={appt => {
            setAppts(prev => [appt, ...prev])
            setShowCreate(false)
            setSelected(appt)
          }}
        />
      )}

      {selected && (
        <ActionModal
          appt={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </>
  )
}
