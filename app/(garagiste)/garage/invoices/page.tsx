'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText, Search, AlertTriangle, RefreshCw, Download, ChevronDown, X, Loader2,
  Plus, Trash2,
} from 'lucide-react'
import {
  authHeaders, fetchMe, fetchInvoicesByGarage, fetchAppointmentsByGarage,
  type InvoiceResponse, type InvoiceStatus, type InvoiceType, type AppointmentResponse,
} from '@/lib/api'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

const TYPE_LABELS: Record<InvoiceType, string> = {
  DEVIS:   'Devis',
  FACTURE: 'Facture',
}

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT:     'Brouillon',
  SENT:      'Envoyé',
  ACCEPTED:  'Accepté',
  REJECTED:  'Refusé',
  PAID:      'Payé',
  CANCELLED: 'Annulé',
}

const STATUS_COLORS: Record<InvoiceStatus, { bg: string; color: string }> = {
  DRAFT:     { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' },
  SENT:      { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
  ACCEPTED:  { bg: 'rgba(99,102,241,0.12)',  color: '#6366f1' },
  REJECTED:  { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
  PAID:      { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
  CANCELLED: { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' },
}

const NEXT_STATUSES: Partial<Record<InvoiceStatus, InvoiceStatus[]>> = {
  DRAFT:    ['SENT', 'CANCELLED'],
  SENT:     ['ACCEPTED', 'REJECTED', 'PAID', 'CANCELLED'],
  ACCEPTED: ['PAID', 'CANCELLED'],
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

interface LineForm {
  description: string
  quantity:    string
  unitPrice:   string
}

function emptyLine(): LineForm {
  return { description: '', quantity: '1', unitPrice: '' }
}

function fmtCurrency(n: number): string {
  return n.toLocaleString('fr-FR') + ' F'
}

function lineTotal(line: LineForm): number {
  const q = Number(line.quantity) || 0
  const p = Number(line.unitPrice) || 0
  return q * p
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
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
  onCreate: (inv: InvoiceResponse) => void
}

function CreateModal({ garageId, onClose, onCreate }: CreateModalProps) {
  const router = useRouter()

  const [appointments, setAppointments] = useState<AppointmentResponse[]>([])
  const [loadingAppts, setLoadingAppts] = useState(true)

  const [type,           setType]           = useState<InvoiceType>('DEVIS')
  const [selectedApptId, setSelectedApptId] = useState<string>('')
  const [taxRate,        setTaxRate]        = useState('18')
  const [issueDate,      setIssueDate]      = useState('')
  const [dueDate,        setDueDate]        = useState('')
  const [lines,          setLines]          = useState<LineForm[]>([emptyLine()])
  const [saving,         setSaving]         = useState(false)
  const [err,            setErr]            = useState<string | null>(null)

  useEffect(() => {
    fetchAppointmentsByGarage(garageId)
      .then(setAppointments)
      .catch(() => {})
      .finally(() => setLoadingAppts(false))
  }, [garageId])

  const selectedAppt = appointments.find(a => String(a.id) === selectedApptId) ?? null

  const totalHT  = lines.reduce((s, l) => s + lineTotal(l), 0)
  const tax      = Number(taxRate) / 100
  const totalTTC = totalHT * (1 + tax)

  function addLine()  { setLines(prev => [...prev, emptyLine()]) }
  function removeLine(i: number) { setLines(prev => prev.filter((_, j) => j !== i)) }
  function updateLine(i: number, key: keyof LineForm, val: string) {
    setLines(prev => prev.map((l, j) => j === i ? { ...l, [key]: val } : l))
  }

  async function handleCreate() {
    setErr(null)
    if (!selectedAppt) { setErr('Sélectionnez un rendez-vous client.'); return }
    if (lines.some(l => !l.description.trim() || !l.unitPrice)) {
      setErr('Complétez toutes les lignes (description + prix unitaire).'); return
    }

    setSaving(true)
    try {
      const res = await fetch(`${API}/api/v1/invoices`, {
        method:  'POST',
        headers: authHeaders(),
        body:    JSON.stringify({
          vehicleId:      selectedAppt.vehicle.id,
          clientId:       selectedAppt.client.id,
          type,
          taxRate:        Number(taxRate) / 100,
          issueDate:      issueDate || undefined,
          dueDate:        dueDate   || undefined,
          lines: lines.map(l => ({
            description: l.description.trim(),
            quantity:    Number(l.quantity) || 1,
            unitPrice:   Number(l.unitPrice),
          })),
        }),
      })
      if (res.status === 401) { router.push('/login'); return }
      if (!res.ok) {
        const b = await res.json().catch(() => ({})) as { message?: string }
        setErr(b.message ?? `Erreur ${res.status}`); return
      }
      onCreate(await res.json() as InvoiceResponse)
    } catch {
      setErr('Impossible de contacter le serveur.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card" style={{ maxWidth: 640 }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Nouveau document</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto', maxHeight: 'calc(90vh - 130px)' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Type *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['DEVIS', 'FACTURE'] as InvoiceType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  style={{
                    flex: 1, height: 38, borderRadius: 7,
                    border: type === t ? 'none' : '1px solid var(--border)',
                    backgroundColor: type === t ? 'var(--accent)' : 'transparent',
                    color:           type === t ? '#fff' : 'var(--text-secondary)',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    transition: 'background-color 150ms ease, color 150ms ease',
                  }}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Rendez-vous client *</label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedApptId}
                onChange={e => setSelectedApptId(e.target.value)}
                style={{ ...inputStyle, paddingRight: 32, appearance: 'none' }}
                className="form-input"
                disabled={loadingAppts}
              >
                <option value="">{loadingAppts ? 'Chargement…' : 'Sélectionner un rendez-vous…'}</option>
                {appointments.map(a => (
                  <option key={a.id} value={String(a.id)}>
                    #{a.id} — {a.client.firstName} {a.client.lastName} · {a.vehicle.brand} {a.vehicle.model} ({a.vehicle.licensePlate})
                  </option>
                ))}
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
            </div>
            {selectedAppt && (
              <div style={{ padding: '10px 12px', borderRadius: 7, backgroundColor: 'var(--bg-elevated)', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 16 }}>
                <span>Client : <strong style={{ color: 'var(--text-primary)' }}>{selectedAppt.client.firstName} {selectedAppt.client.lastName}</strong></span>
                <span>Véhicule : <strong style={{ color: 'var(--text-primary)' }}>{selectedAppt.vehicle.licensePlate}</strong></span>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Date d&apos;émission</label>
              <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} style={inputStyle} className="form-input" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Date d&apos;échéance</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputStyle} className="form-input" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>TVA (%)</label>
              <input type="number" min="0" max="100" value={taxRate} onChange={e => setTaxRate(e.target.value)} style={inputStyle} className="form-input" placeholder="18" />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={labelStyle}>Lignes *</label>
              <button
                onClick={addLine}
                style={{ display: 'flex', alignItems: 'center', gap: 4, height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
              >
                <Plus size={12} /> Ajouter une ligne
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 70px 100px 80px 28px', gap: 8, paddingLeft: 2 }}>
              {['Description', 'Qté', 'Prix unit.', 'Total', ''].map((h, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
              ))}
            </div>

            {lines.map((line, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 70px 100px 80px 28px', gap: 8, alignItems: 'center' }}>
                <input
                  value={line.description}
                  onChange={e => updateLine(i, 'description', e.target.value)}
                  placeholder="Main-d'œuvre, pièce…"
                  style={inputStyle}
                  className="form-input"
                />
                <input
                  type="number" min="1"
                  value={line.quantity}
                  onChange={e => updateLine(i, 'quantity', e.target.value)}
                  style={{ ...inputStyle, textAlign: 'center' }}
                  className="form-input"
                />
                <input
                  type="number" min="0"
                  value={line.unitPrice}
                  onChange={e => updateLine(i, 'unitPrice', e.target.value)}
                  placeholder="0"
                  style={inputStyle}
                  className="form-input"
                />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', textAlign: 'right', paddingRight: 4 }}>
                  {lineTotal(line) > 0 ? fmtCurrency(lineTotal(line)) : '—'}
                </span>
                <button
                  onClick={() => removeLine(i)}
                  disabled={lines.length === 1}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: 'none', backgroundColor: 'transparent', color: lines.length === 1 ? 'var(--text-muted)' : 'var(--danger)', cursor: lines.length === 1 ? 'not-allowed' : 'pointer' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border)', marginTop: 4 }}>
              <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total HT</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500, minWidth: 80, textAlign: 'right' }}>{fmtCurrency(totalHT)}</span>
              </div>
              <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>TVA ({taxRate}%)</span>
                <span style={{ color: 'var(--text-secondary)', minWidth: 80, textAlign: 'right' }}>{fmtCurrency(totalTTC - totalHT)}</span>
              </div>
              <div style={{ display: 'flex', gap: 20, fontSize: 15, fontWeight: 700 }}>
                <span style={{ color: 'var(--text-primary)' }}>Total TTC</span>
                <span style={{ color: 'var(--accent)', minWidth: 80, textAlign: 'right' }}>{fmtCurrency(totalTTC)}</span>
              </div>
            </div>
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
              Créer le {TYPE_LABELS[type].toLowerCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface InvoiceModalProps {
  invoice:  InvoiceResponse
  onClose:  () => void
  onUpdate: (updated: InvoiceResponse) => void
  onPdf:    (id: number) => void
}

function InvoiceModal({ invoice, onClose, onUpdate, onPdf }: InvoiceModalProps) {
  const router = useRouter()
  const [busy,      setBusy]      = useState(false)
  const [newStatus, setNewStatus] = useState<InvoiceStatus | ''>('')
  const [err,       setErr]       = useState<string | null>(null)

  const nextStatuses = NEXT_STATUSES[invoice.status] ?? []

  async function updateStatus() {
    if (!newStatus) return
    setBusy(true); setErr(null)
    try {
      const res = await fetch(`${API}/api/v1/invoices/${invoice.id}/status`, {
        method:  'PUT',
        headers: authHeaders(),
        body:    JSON.stringify({ status: newStatus }),
      })
      if (res.status === 401) { router.push('/login'); return }
      if (!res.ok) {
        const b = await res.json().catch(() => ({})) as { message?: string }
        setErr(b.message ?? `Erreur ${res.status}`); return
      }
      onUpdate(await res.json() as InvoiceResponse)
    } catch {
      setErr('Impossible de contacter le serveur.')
    } finally {
      setBusy(false)
    }
  }

  async function convertToInvoice() {
    setBusy(true); setErr(null)
    try {
      const res = await fetch(`${API}/api/v1/invoices/${invoice.id}/convert`, {
        method: 'POST', headers: authHeaders(),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({})) as { message?: string }
        setErr(b.message ?? `Erreur ${res.status}`); return
      }
      onUpdate(await res.json() as InvoiceResponse)
    } catch {
      setErr('Impossible de contacter le serveur.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card" style={{ maxWidth: 580 }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                {TYPE_LABELS[invoice.type]} {invoice.invoiceNumber}
              </h2>
              <StatusBadge status={invoice.status} />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              {invoice.clientName} — {invoice.vehicleLicensePlate ?? 'sans véhicule'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <p style={{ ...labelStyle, marginBottom: 8 }}>Lignes</p>
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', gap: 12, padding: '8px 12px', backgroundColor: 'var(--bg-elevated)', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                <span>Description</span><span>Qté</span><span>P.U.</span><span style={{ textAlign: 'right' }}>Total</span>
              </div>
              {invoice.lines.map((line, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', gap: 12, padding: '9px 12px', borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-primary)' }}>
                  <span>{line.description}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{line.quantity}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{fmtCurrency(line.unitPrice)}</span>
                  <span style={{ textAlign: 'right' }}>{fmtCurrency(line.totalHT)}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total HT</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{fmtCurrency(invoice.totalHT)}</span>
            </div>
            <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>TVA ({invoice.taxRate}%)</span>
              <span style={{ color: 'var(--text-secondary)' }}>{fmtCurrency(invoice.totalTTC - invoice.totalHT)}</span>
            </div>
            <div style={{ display: 'flex', gap: 24, fontSize: 15, fontWeight: 600, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-primary)' }}>Total TTC</span>
              <span style={{ color: 'var(--accent)' }}>{fmtCurrency(invoice.totalTTC)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
            <button
              onClick={() => onPdf(invoice.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 7, border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              <Download size={13} /> Télécharger PDF
            </button>

            {invoice.type === 'DEVIS' && invoice.status === 'ACCEPTED' && (
              <button
                onClick={convertToInvoice}
                disabled={busy}
                style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 7, border: 'none', backgroundColor: '#6366f1', color: '#fff', fontSize: 12, fontWeight: 500, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)' }}
              >
                {busy && <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} />}
                Convertir en facture
              </button>
            )}

            {nextStatuses.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as InvoiceStatus)}
                    style={{ ...inputStyle, width: 'auto', height: 36, paddingRight: 28, appearance: 'none' }}
                    className="form-input"
                  >
                    <option value="">Changer le statut…</option>
                    {nextStatuses.map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                </div>
                <button
                  onClick={updateStatus}
                  disabled={busy || !newStatus}
                  style={{ height: 36, padding: '0 14px', borderRadius: 7, border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 500, cursor: (busy || !newStatus) ? 'not-allowed' : 'pointer', opacity: (busy || !newStatus) ? 0.6 : 1, fontFamily: 'var(--font-body)' }}
                >
                  Appliquer
                </button>
              </div>
            )}
          </div>

          {err && <p style={{ fontSize: 12, color: 'var(--danger)' }}>{err}</p>}
        </div>
      </div>
    </div>
  )
}

export default function GaragisteInvoicesPage() {
  const router = useRouter()

  const [invoices,      setInvoices]      = useState<InvoiceResponse[]>([])
  const [garageId,      setGarageId]      = useState<number | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [fetchError,    setFetchError]    = useState<string | null>(null)
  const [search,        setSearch]        = useState('')
  const [typeFilter,    setTypeFilter]    = useState<InvoiceType | 'ALL'>('ALL')
  const [statusFilter,  setStatusFilter]  = useState<InvoiceStatus | 'ALL'>('ALL')
  const [selected,      setSelected]      = useState<InvoiceResponse | null>(null)
  const [showCreate,    setShowCreate]    = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setFetchError(null)
    try {
      const me = await fetchMe()
      if (!me.garageId) { setFetchError('Aucun garage associé à votre compte.'); return }
      setGarageId(me.garageId)
      const list = await fetchInvoicesByGarage(me.garageId)
      setInvoices(list)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue'
      if (msg.includes('401')) { router.push('/login?redirect=/garage/invoices'); return }
      setFetchError(msg)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSelected(null); setShowCreate(false) } }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  const q = search.toLowerCase().trim()
  const filtered = invoices.filter(inv => {
    const matchType   = typeFilter   === 'ALL' || inv.type   === typeFilter
    const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter
    const matchSearch = !q || [
      inv.invoiceNumber, inv.clientName, inv.clientEmail,
      inv.vehicleLicensePlate ?? '',
    ].some(s => s.toLowerCase().includes(q))
    return matchType && matchStatus && matchSearch
  })

  async function downloadPdf(id: number) {
    try {
      const res = await fetch(`${API}/api/v1/invoices/${id}/pdf`, { headers: authHeaders() })
      if (!res.ok) { alert('Erreur lors du téléchargement.'); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `document-${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Impossible de télécharger le PDF.')
    }
  }

  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.totalTTC, 0)

  return (
    <>
      <style>{`
        .inv-row:hover { background-color: var(--bg-elevated); }
        .action-btn { opacity: 0; transition: opacity 150ms ease; }
        .inv-row:hover .action-btn { opacity: 1; }
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
                Factures & Devis
              </h2>
              {!loading && !fetchError && (
                <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 8px', borderRadius: 11, backgroundColor: 'var(--accent-muted)', color: 'var(--accent)', fontSize: 12, fontWeight: 600 }}>
                  {invoices.length}
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              Gérez vos devis et factures clients.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', borderRadius: 8, border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--font-body)' }}
          >
            <Plus size={15} strokeWidth={2} />
            Créer un document
          </button>
        </div>

        {!loading && !fetchError && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'Total documents', value: invoices.length,                                   color: 'var(--accent)' },
              { label: 'Devis',           value: invoices.filter(i => i.type === 'DEVIS').length,   color: '#6366f1'       },
              { label: 'Factures payées', value: invoices.filter(i => i.status === 'PAID').length,  color: '#10b981'       },
              { label: 'Revenu encaissé', value: fmtCurrency(totalPaid),                            color: '#10b981'       },
            ].map((kpi, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: kpi.color }}>{kpi.value}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{kpi.label}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={14} strokeWidth={1.75} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher N°, client…" style={{ ...inputStyle, paddingLeft: 32 }} className="form-input" />
          </div>
          <div style={{ position: 'relative' }}>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as InvoiceType | 'ALL')} style={{ ...inputStyle, width: 'auto', paddingRight: 32, appearance: 'none' }} className="form-input">
              <option value="ALL">Tous les types</option>
              {(Object.keys(TYPE_LABELS) as InvoiceType[]).map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
          </div>
          <div style={{ position: 'relative' }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as InvoiceStatus | 'ALL')} style={{ ...inputStyle, width: 'auto', paddingRight: 32, appearance: 'none' }} className="form-input">
              <option value="ALL">Tous les statuts</option>
              {(Object.keys(STATUS_LABELS) as InvoiceStatus[]).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
          </div>
        </div>

        {loading ? (
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 20px', borderBottom: i < 4 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
                {[100, 130, 100, 80, 70, 60].map((w, j) => (
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
            <FileText size={36} strokeWidth={1.2} style={{ color: 'var(--text-muted)' }} />
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
              {search || typeFilter !== 'ALL' || statusFilter !== 'ALL' ? 'Aucun résultat' : 'Aucune facture'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {search || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Modifiez vos filtres.'
                : 'Créez votre premier devis ou facture.'}
            </p>
            {!search && typeFilter === 'ALL' && statusFilter === 'ALL' && (
              <button
                onClick={() => setShowCreate(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', borderRadius: 8, border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', marginTop: 4, fontFamily: 'var(--font-body)' }}
              >
                <Plus size={14} /> Créer un document
              </button>
            )}
          </div>
        ) : (
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 80px 1.5fr 1fr 1fr auto', gap: 16, padding: '10px 20px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)' }}>
              {['Numéro', 'Type', 'Client', 'Montant TTC', 'Statut', ''].map((h, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
              ))}
            </div>

            {filtered.map((inv, idx) => (
              <div
                key={inv.id}
                className="inv-row"
                style={{ display: 'grid', gridTemplateColumns: '130px 80px 1.5fr 1fr 1fr auto', gap: 16, padding: '13px 20px', borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', cursor: 'pointer', transition: 'background-color 150ms ease' }}
                onClick={() => setSelected(inv)}
              >
                <p style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 500 }}>{inv.invoiceNumber}</p>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 7px', borderRadius: 4,
                  backgroundColor: inv.type === 'DEVIS' ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)',
                  color: inv.type === 'DEVIS' ? '#6366f1' : '#10b981',
                  fontSize: 11, fontWeight: 600,
                }}>
                  {TYPE_LABELS[inv.type]}
                </span>
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>{inv.clientName}</p>
                  {inv.vehicleLicensePlate && (
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>{inv.vehicleLicensePlate}</p>
                  )}
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{fmtCurrency(inv.totalTTC)}</p>
                <StatusBadge status={inv.status} />
                <button
                  className="action-btn"
                  onClick={e => { e.stopPropagation(); downloadPdf(inv.id) }}
                  title="Télécharger PDF"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  <Download size={12} />
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
          onCreate={inv => {
            setInvoices(prev => [inv, ...prev])
            setShowCreate(false)
            setSelected(inv)
          }}
        />
      )}

      {selected && (
        <InvoiceModal
          invoice={selected}
          onClose={() => setSelected(null)}
          onUpdate={updated => {
            setInvoices(prev => prev.map(i => i.id === updated.id ? updated : i))
            setSelected(updated)
          }}
          onPdf={downloadPdf}
        />
      )}
    </>
  )
}
