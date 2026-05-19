'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Wrench, Search, Plus, AlertTriangle, RefreshCw, X, Loader2, ChevronDown,
} from 'lucide-react'
import {
  authHeaders, fetchMe, fetchInterventionsByGarage,
  fetchAppointmentsByGarage, fetchTechniciansByGarage,
  type InterventionResponse, type InterventionStatus,
  type AppointmentResponse, type TechnicianResponse,
} from '@/lib/api'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

const STATUS_LABELS: Record<InterventionStatus, string> = {
  IN_PROGRESS: 'En cours',
  ON_HOLD:     'En attente',
  COMPLETED:   'Terminée',
}

const STATUS_COLORS: Record<InterventionStatus, { bg: string; color: string }> = {
  IN_PROGRESS: { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
  ON_HOLD:     { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  COMPLETED:   { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtCurrency(n: number | null): string {
  if (n == null) return '—'
  return n.toLocaleString('fr-FR') + ' F'
}

function StatusBadge({ status }: { status: InterventionStatus }) {
  const { bg, color } = STATUS_COLORS[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 8px', borderRadius: 11, backgroundColor: bg, color, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {STATUS_LABELS[status]}
    </span>
  )
}

interface CreateModalProps {
  garageId: number
  onClose:  () => void
  onCreate: (iv: InterventionResponse) => void
}

function CreateModal({ garageId, onClose, onCreate }: CreateModalProps) {
  const router = useRouter()

  const [appointments,  setAppointments]  = useState<AppointmentResponse[]>([])
  const [technicians,   setTechnicians]   = useState<TechnicianResponse[]>([])
  const [loadingLists,  setLoadingLists]  = useState(true)

  const [appointmentId,  setAppointmentId]  = useState('')
  const [vehicleId,      setVehicleId]      = useState('')
  const [technicianId,   setTechnicianId]   = useState('')
  const [interventionDate, setInterventionDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [mileage,        setMileage]        = useState('')
  const [laborCost,      setLaborCost]      = useState('')
  const [diagnosis,      setDiagnosis]      = useState('')
  const [workDesc,       setWorkDesc]       = useState('')
  const [saving,         setSaving]         = useState(false)
  const [err,            setErr]            = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetchAppointmentsByGarage(garageId).catch(() => [] as AppointmentResponse[]),
      fetchTechniciansByGarage(garageId).catch(() => [] as TechnicianResponse[]),
    ])
      .then(([appts, techs]) => {
        setAppointments(appts)
        setTechnicians(techs)
      })
      .finally(() => setLoadingLists(false))
  }, [garageId])

  const selectedAppt = appointments.find(a => String(a.id) === appointmentId) ?? null

  useEffect(() => {
    if (selectedAppt) setVehicleId(String(selectedAppt.vehicle.id))
  }, [selectedAppt])

  async function handleCreate() {
    setErr(null)
    if (!vehicleId) { setErr('Le véhicule est obligatoire.'); return }
    if (!interventionDate) { setErr('La date est obligatoire.'); return }

    setSaving(true)
    try {
      const res = await fetch(`${API}/api/v1/interventions`, {
        method:  'POST',
        headers: authHeaders(),
        body:    JSON.stringify({
          appointmentId:         appointmentId ? Number(appointmentId) : undefined,
          vehicleId:             Number(vehicleId),
          technicianId:          technicianId  ? Number(technicianId)  : undefined,
          interventionDate,
          mileageAtIntervention: mileage   ? Number(mileage)   : undefined,
          laborCost:             laborCost ? Number(laborCost) : undefined,
          diagnosis:             diagnosis.trim()  || undefined,
          workDescription:       workDesc.trim()   || undefined,
        }),
      })
      if (res.status === 401) { router.push('/login'); return }
      if (!res.ok) {
        const b = await res.json().catch(() => ({})) as { message?: string }
        setErr(b.message ?? `Erreur ${res.status}`); return
      }
      onCreate(await res.json() as InterventionResponse)
    } catch {
      setErr('Impossible de contacter le serveur.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card" style={{ maxWidth: 580 }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Nouvelle intervention</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', maxHeight: 'calc(90vh - 120px)' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Lier à un rendez-vous (optionnel)</label>
            <div style={{ position: 'relative' }}>
              <select
                value={appointmentId}
                onChange={e => setAppointmentId(e.target.value)}
                style={{ ...inputStyle, paddingRight: 32, appearance: 'none' }}
                className="form-input"
                disabled={loadingLists}
              >
                <option value="">{loadingLists ? 'Chargement…' : 'Aucun rendez-vous associé'}</option>
                {appointments.map(a => (
                  <option key={a.id} value={String(a.id)}>
                    #{a.id} — {a.client.firstName} {a.client.lastName} · {a.vehicle.brand} {a.vehicle.model} ({a.vehicle.licensePlate})
                  </option>
                ))}
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
            </div>
            {selectedAppt && (
              <div style={{ padding: '8px 12px', borderRadius: 7, backgroundColor: 'var(--bg-elevated)', fontSize: 12, color: 'var(--text-secondary)' }}>
                Véhicule <strong style={{ color: 'var(--text-primary)' }}>{selectedAppt.vehicle.licensePlate}</strong> sélectionné automatiquement
              </div>
            )}
          </div>

          {!selectedAppt && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>ID du véhicule *</label>
              <input
                type="number" min="1"
                value={vehicleId}
                onChange={e => setVehicleId(e.target.value)}
                style={inputStyle} className="form-input"
                placeholder="Ex. : 5 (visible dans la page Véhicules)"
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Date d&apos;intervention *</label>
              <input
                type="date"
                value={interventionDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={e => setInterventionDate(e.target.value)}
                style={inputStyle} className="form-input"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Technicien</label>
              <div style={{ position: 'relative' }}>
                <select
                  value={technicianId}
                  onChange={e => setTechnicianId(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 32, appearance: 'none' }}
                  className="form-input"
                  disabled={loadingLists}
                >
                  <option value="">Non assigné</option>
                  {technicians.map(t => (
                    <option key={t.id} value={String(t.id)}>
                      {t.firstName} {t.lastName}{t.specialty ? ` — ${t.specialty}` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Kilométrage</label>
              <input
                type="number" min="0"
                value={mileage}
                onChange={e => setMileage(e.target.value)}
                style={inputStyle} className="form-input"
                placeholder="Ex. : 45000"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Main-d&apos;œuvre (FCFA)</label>
              <input
                type="number" min="0"
                value={laborCost}
                onChange={e => setLaborCost(e.target.value)}
                style={inputStyle} className="form-input"
                placeholder="0"
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Diagnostic</label>
            <textarea
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
              rows={2}
              placeholder="Problème identifié…"
              style={{ ...inputStyle, height: 'auto', padding: '8px 10px', resize: 'vertical' }}
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Travaux effectués</label>
            <textarea
              value={workDesc}
              onChange={e => setWorkDesc(e.target.value)}
              rows={2}
              placeholder="Remplacement filtre, vidange…"
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
              Créer l&apos;intervention
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface DetailModalProps {
  intervention: InterventionResponse
  onClose:      () => void
  onUpdate:     (updated: InterventionResponse) => void
}

function DetailModal({ intervention: iv, onClose, onUpdate }: DetailModalProps) {
  const router = useRouter()
  const [status, setStatus] = useState<InterventionStatus>(iv.status)
  const [busy,   setBusy]   = useState(false)
  const [err,    setErr]    = useState<string | null>(null)

  async function updateStatus() {
    if (status === iv.status) { onClose(); return }
    setBusy(true); setErr(null)
    try {
      const res = await fetch(`${API}/api/v1/interventions/${iv.id}/status`, {
        method:  'PUT',
        headers: authHeaders(),
        body:    JSON.stringify({ status }),
      })
      if (res.status === 401) { router.push('/login'); return }
      if (!res.ok) {
        const b = await res.json().catch(() => ({})) as { message?: string }
        setErr(b.message ?? `Erreur ${res.status}`); return
      }
      onUpdate(await res.json() as InterventionResponse)
    } catch {
      setErr('Impossible de contacter le serveur.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card" style={{ maxWidth: 560 }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Intervention #{iv.id}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{iv.vehicleBrand} {iv.vehicleModel} — {iv.vehicleLicensePlate}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <p style={labelStyle}>Technicien</p>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>{iv.technicianName ?? '—'}</p>
            </div>
            <div>
              <p style={labelStyle}>Date</p>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>{formatDate(iv.interventionDate)}</p>
            </div>
            <div>
              <p style={labelStyle}>Kilométrage</p>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>
                {iv.mileageAtIntervention != null ? iv.mileageAtIntervention.toLocaleString('fr-FR') + ' km' : '—'}
              </p>
            </div>
            <div>
              <p style={labelStyle}>Main-d&apos;œuvre</p>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>{fmtCurrency(iv.laborCost)}</p>
            </div>
            {iv.diagnosis && (
              <div style={{ gridColumn: '1/-1' }}>
                <p style={labelStyle}>Diagnostic</p>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>{iv.diagnosis}</p>
              </div>
            )}
            {iv.workDescription && (
              <div style={{ gridColumn: '1/-1' }}>
                <p style={labelStyle}>Travaux effectués</p>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>{iv.workDescription}</p>
              </div>
            )}
          </div>

          {iv.partsUsed.length > 0 && (
            <div>
              <p style={{ ...labelStyle, marginBottom: 8 }}>Pièces utilisées</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {iv.partsUsed.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'var(--bg-elevated)', borderRadius: 6, fontSize: 12 }}>
                    <span style={{ color: 'var(--text-primary)' }}>{p.partName} × {p.quantity}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{fmtCurrency(p.unitPrice * p.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Changer le statut</label>
            <div style={{ position: 'relative' }}>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as InterventionStatus)}
                style={{ ...inputStyle, paddingRight: 32, appearance: 'none' }}
                className="form-input"
              >
                {(Object.keys(STATUS_LABELS) as InterventionStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {err && <p style={{ fontSize: 12, color: 'var(--danger)' }}>{err}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={onClose} style={{ height: 38, padding: '0 16px', borderRadius: 7, border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              Fermer
            </button>
            <button
              onClick={updateStatus}
              disabled={busy || status === iv.status}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 20px', borderRadius: 7, border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: (busy || status === iv.status) ? 'not-allowed' : 'pointer', opacity: (busy || status === iv.status) ? 0.6 : 1, fontFamily: 'var(--font-body)' }}
            >
              {busy && <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />}
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GaragisteInterventionsPage() {
  const router = useRouter()

  const [interventions, setInterventions] = useState<InterventionResponse[]>([])
  const [garageId,      setGarageId]      = useState<number | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [fetchError,    setFetchError]    = useState<string | null>(null)
  const [search,        setSearch]        = useState('')
  const [statusFilter,  setStatusFilter]  = useState<InterventionStatus | 'ALL'>('ALL')
  const [selected,      setSelected]      = useState<InterventionResponse | null>(null)
  const [showCreate,    setShowCreate]    = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setFetchError(null)
    try {
      const me = await fetchMe()
      if (!me.garageId) { setFetchError('Aucun garage associé à votre compte.'); return }
      setGarageId(me.garageId)
      const list = await fetchInterventionsByGarage(me.garageId)
      setInterventions(list)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue'
      if (msg.includes('401')) { router.push('/login?redirect=/garage/interventions'); return }
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
  const filtered = interventions.filter(iv => {
    const matchStatus = statusFilter === 'ALL' || iv.status === statusFilter
    const matchSearch = !q || [
      iv.vehicleLicensePlate, iv.vehicleBrand, iv.vehicleModel,
      iv.technicianName ?? '', iv.workDescription ?? '', iv.diagnosis ?? '',
    ].some(s => s.toLowerCase().includes(q))
    return matchStatus && matchSearch
  })

  return (
    <>
      <style>{`
        .iv-row:hover { background-color: var(--bg-elevated); }
        .action-btn { opacity: 0; transition: opacity 150ms ease; }
        .iv-row:hover .action-btn { opacity: 1; }
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
                Interventions
              </h2>
              {!loading && !fetchError && (
                <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 8px', borderRadius: 11, backgroundColor: 'var(--accent-muted)', color: 'var(--accent)', fontSize: 12, fontWeight: 600 }}>
                  {interventions.length}
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              Suivez les travaux en cours et l&apos;historique des interventions.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', borderRadius: 8, border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--font-body)' }}
          >
            <Plus size={15} strokeWidth={2} />
            Nouvelle intervention
          </button>
        </div>

        {!loading && !fetchError && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(Object.keys(STATUS_LABELS) as InterventionStatus[]).map(s => {
              const count = interventions.filter(iv => iv.status === s).length
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: STATUS_COLORS[s].color }}>{count}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{STATUS_LABELS[s]}</span>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={14} strokeWidth={1.75} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher véhicule, technicien…" style={{ ...inputStyle, paddingLeft: 32 }} className="form-input" />
          </div>
          <div style={{ position: 'relative' }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as InterventionStatus | 'ALL')} style={{ ...inputStyle, width: 'auto', paddingRight: 32, appearance: 'none' }} className="form-input">
              <option value="ALL">Tous les statuts</option>
              {(Object.keys(STATUS_LABELS) as InterventionStatus[]).map(s => (
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
                {[120, 100, 90, 80, 70, 70].map((w, j) => (
                  <div key={j} style={{ height: 14, width: w, borderRadius: 4, backgroundColor: 'var(--bg-elevated)' }} />
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
            <Wrench size={36} strokeWidth={1.2} style={{ color: 'var(--text-muted)' }} />
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
              {search || statusFilter !== 'ALL' ? 'Aucun résultat' : 'Aucune intervention'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {search || statusFilter !== 'ALL' ? 'Modifiez vos filtres.' : 'Créez votre première intervention.'}
            </p>
            {!search && statusFilter === 'ALL' && (
              <button
                onClick={() => setShowCreate(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', borderRadius: 8, border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', marginTop: 4, fontFamily: 'var(--font-body)' }}
              >
                <Plus size={14} /> Nouvelle intervention
              </button>
            )}
          </div>
        ) : (
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1fr auto', gap: 16, padding: '10px 20px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)' }}>
              {['Véhicule', 'Travaux', 'Technicien', 'Date', 'Statut', ''].map((h, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
              ))}
            </div>

            {filtered.map((iv, idx) => (
              <div
                key={iv.id}
                className="iv-row"
                style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1fr auto', gap: 16, padding: '13px 20px', borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', cursor: 'pointer', transition: 'background-color 150ms ease' }}
                onClick={() => setSelected(iv)}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{iv.vehicleBrand} {iv.vehicleModel}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>{iv.vehicleLicensePlate}</p>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {iv.workDescription || iv.diagnosis || '—'}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{iv.technicianName ?? '—'}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(iv.interventionDate)}</p>
                <StatusBadge status={iv.status} />
                <button
                  className="action-btn"
                  onClick={e => { e.stopPropagation(); setSelected(iv) }}
                  style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}
                >
                  Détails
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
          onCreate={iv => {
            setInterventions(prev => [iv, ...prev])
            setShowCreate(false)
            setSelected(iv)
          }}
        />
      )}

      {selected && (
        <DetailModal
          intervention={selected}
          onClose={() => setSelected(null)}
          onUpdate={updated => {
            setInterventions(prev => prev.map(iv => iv.id === updated.id ? updated : iv))
            setSelected(updated)
          }}
        />
      )}
    </>
  )
}
