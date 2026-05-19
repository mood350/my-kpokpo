'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle, RefreshCw, Loader2, CheckCircle,
} from 'lucide-react'
import {
  authHeaders,
  fetchMe,
  fetchGarage,
  fetchWorkingHours,
  type GarageResponse,
  type WorkingHoursResponse,
} from '@/lib/api'

// ─── Constants ────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

const DAYS_FR: Record<string, string> = {
  MONDAY:    'Lundi',
  TUESDAY:   'Mardi',
  WEDNESDAY: 'Mercredi',
  THURSDAY:  'Jeudi',
  FRIDAY:    'Vendredi',
  SATURDAY:  'Samedi',
  SUNDAY:    'Dimanche',
}

const DAYS_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface GarageForm {
  name:        string
  phone:       string
  email:       string
  address:     string
  city:        string
  country:     string
  description: string
}

interface HoursEntry {
  dayOfWeek: string
  openTime:  string
  closeTime: string
  closed:    boolean
}

function garageToForm(g: GarageResponse): GarageForm {
  return {
    name:        g.name        ?? '',
    phone:       g.phone       ?? '',
    email:       g.email       ?? '',
    address:     g.address     ?? '',
    city:        g.city        ?? '',
    country:     g.country     ?? 'Togo',
    description: g.description ?? '',
  }
}

function defaultHours(): HoursEntry[] {
  return DAYS_ORDER.map(d => ({
    dayOfWeek: d,
    openTime:  '08:00',
    closeTime: '18:00',
    closed:    d === 'SUNDAY',
  }))
}

function hoursFromResponse(list: WorkingHoursResponse[]): HoursEntry[] {
  return DAYS_ORDER.map(day => {
    const found = list.find(h => h.dayOfWeek === day)
    if (!found) return { dayOfWeek: day, openTime: '08:00', closeTime: '18:00', closed: false }
    return {
      dayOfWeek: day,
      openTime:  found.openTime  ?? '08:00',
      closeTime: found.closeTime ?? '18:00',
      closed:    found.closed,
    }
  })
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</p>
      </div>
      <div style={{ padding: '20px 24px' }}>
        {children}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GaragisteSettingsPage() {
  const router = useRouter()

  const [garageId,    setGarageId]    = useState<number | null>(null)
  const [garage,      setGarage]      = useState<GarageResponse | null>(null)
  const [hours,       setHours]       = useState<HoursEntry[]>(defaultHours())
  const [loading,     setLoading]     = useState(true)
  const [fetchError,  setFetchError]  = useState<string | null>(null)

  const [garageForm,  setGarageForm]  = useState<GarageForm>({ name: '', phone: '', email: '', address: '', city: '', country: 'Togo', description: '' })
  const [savingGarage, setSavingGarage] = useState(false)
  const [savingHours,  setSavingHours]  = useState(false)
  const [garageError,  setGarageError]  = useState<string | null>(null)
  const [hoursError,   setHoursError]   = useState<string | null>(null)
  const [garageOk,     setGarageOk]     = useState(false)
  const [hoursOk,      setHoursOk]      = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setFetchError(null)
    try {
      const me = await fetchMe()
      if (!me.garageId) {
        setFetchError('Aucun garage associé à votre compte.')
        return
      }
      const gid = me.garageId
      setGarageId(gid)

      const [g, h] = await Promise.all([
        fetchGarage(gid),
        fetchWorkingHours(gid).catch(() => [] as WorkingHoursResponse[]),
      ])

      setGarage(g)
      setGarageForm(garageToForm(g))
      setHours(h.length > 0 ? hoursFromResponse(h) : defaultHours())
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue'
      if (msg.includes('401')) { router.push('/login?redirect=/garage/settings'); return }
      setFetchError(msg)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { load() }, [load])

  function gField(key: keyof GarageForm, value: string) {
    setGarageForm(prev => ({ ...prev, [key]: value }))
  }

  function updateHour(day: string, field: keyof HoursEntry, value: string | boolean) {
    setHours(prev => prev.map(h => h.dayOfWeek === day ? { ...h, [field]: value } : h))
  }

  async function saveGarage() {
    if (!garageId) return
    setSavingGarage(true); setGarageError(null); setGarageOk(false)
    try {
      const res = await fetch(`${API}/api/v1/garages/${garageId}`, {
        method:  'PUT',
        headers: authHeaders(),
        body:    JSON.stringify({
          name:        garageForm.name.trim(),
          phone:       garageForm.phone.trim() || null,
          email:       garageForm.email.trim() || null,
          address:     garageForm.address.trim() || null,
          city:        garageForm.city.trim() || null,
          country:     garageForm.country.trim() || 'Togo',
          description: garageForm.description.trim() || null,
        }),
      })
      if (res.status === 401) { router.push('/login'); return }
      if (!res.ok) {
        const b = await res.json().catch(() => ({})) as { message?: string }
        setGarageError(b.message ?? `Erreur ${res.status}`); return
      }
      setGarage(await res.json() as GarageResponse)
      setGarageOk(true)
      setTimeout(() => setGarageOk(false), 3000)
    } catch {
      setGarageError('Impossible de contacter le serveur.')
    } finally {
      setSavingGarage(false)
    }
  }

  async function saveHours() {
    if (!garageId) return
    setSavingHours(true); setHoursError(null); setHoursOk(false)
    try {
      const payload = hours.map(h => ({
        dayOfWeek: h.dayOfWeek,
        openTime:  h.closed ? null : h.openTime,
        closeTime: h.closed ? null : h.closeTime,
        closed:    h.closed,
      }))
      const res = await fetch(`${API}/api/v1/garages/${garageId}/working-hours`, {
        method:  'POST',
        headers: authHeaders(),
        body:    JSON.stringify(payload),
      })
      if (res.status === 401) { router.push('/login'); return }
      if (!res.ok) {
        const b = await res.json().catch(() => ({})) as { message?: string }
        setHoursError(b.message ?? `Erreur ${res.status}`); return
      }
      const saved = await res.json() as WorkingHoursResponse[]
      setHours(hoursFromResponse(saved))
      setHoursOk(true)
      setTimeout(() => setHoursOk(false), 3000)
    } catch {
      setHoursError('Impossible de contacter le serveur.')
    } finally {
      setSavingHours(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {[160, 300, 240].map((h, i) => (
          <div key={i} style={{ height: h, borderRadius: 12, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
        ))}
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

  return (
    <>
      <style>{`
        .form-input:focus { border-color: var(--accent) !important; }
        .toggle-track {
          display: inline-flex;
          align-items: center;
          width: 36px;
          height: 20px;
          border-radius: 10px;
          cursor: pointer;
          transition: background-color 200ms ease;
          flex-shrink: 0;
        }
        .toggle-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          transition: transform 200ms ease;
          margin: 0 2px;
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 2px', maxWidth: 720 }}>

        <div>
          <h2 className="font-display" style={{ fontSize: 22, fontWeight: 400, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Paramètres
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            Informations de votre garage et horaires d&apos;ouverture.
          </p>
        </div>

        <SectionCard title="Informations du garage">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: '1/-1' }}>
              <label style={labelStyle}>Nom du garage *</label>
              <input value={garageForm.name} onChange={e => gField('name', e.target.value)} style={inputStyle} className="form-input" placeholder="Garage Central" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Téléphone</label>
              <input value={garageForm.phone} onChange={e => gField('phone', e.target.value)} style={inputStyle} className="form-input" placeholder="+228 90 00 00 00" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={garageForm.email} onChange={e => gField('email', e.target.value)} style={inputStyle} className="form-input" placeholder="contact@garage.tg" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Ville</label>
              <input value={garageForm.city} onChange={e => gField('city', e.target.value)} style={inputStyle} className="form-input" placeholder="Lomé" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Pays</label>
              <input value={garageForm.country} onChange={e => gField('country', e.target.value)} style={inputStyle} className="form-input" placeholder="Togo" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: '1/-1' }}>
              <label style={labelStyle}>Adresse</label>
              <input value={garageForm.address} onChange={e => gField('address', e.target.value)} style={inputStyle} className="form-input" placeholder="Avenue de la Victoire, Tokoin" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: '1/-1' }}>
              <label style={labelStyle}>Description</label>
              <textarea
                value={garageForm.description}
                onChange={e => gField('description', e.target.value)}
                rows={3}
                placeholder="Décrivez votre garage, vos services…"
                style={{ ...inputStyle, height: 'auto', padding: '8px 10px', resize: 'vertical' }}
                className="form-input"
              />
            </div>
          </div>

          {garageError && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 12 }}>{garageError}</p>}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
            {garageOk && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#10b981' }}>
                <CheckCircle size={14} /> Enregistré
              </span>
            )}
            <button
              onClick={saveGarage}
              disabled={savingGarage}
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 20px', borderRadius: 7, border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: savingGarage ? 'not-allowed' : 'pointer', opacity: savingGarage ? 0.7 : 1, fontFamily: 'var(--font-body)' }}
            >
              {savingGarage && <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />}
              Enregistrer
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Horaires d'ouverture">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {hours.map(h => (
              <div key={h.dayOfWeek} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', width: 100, flexShrink: 0 }}>
                  {DAYS_FR[h.dayOfWeek]}
                </span>

                <button
                  className="toggle-track"
                  onClick={() => updateHour(h.dayOfWeek, 'closed', !h.closed)}
                  aria-label={h.closed ? 'Fermé — cliquer pour ouvrir' : 'Ouvert — cliquer pour fermer'}
                  style={{ backgroundColor: h.closed ? 'var(--bg-elevated)' : 'var(--accent)' }}
                >
                  <div className="toggle-thumb" style={{ transform: h.closed ? 'translateX(0)' : 'translateX(16px)' }} />
                </button>

                {h.closed ? (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Fermé</span>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="time"
                      value={h.openTime}
                      onChange={e => updateHour(h.dayOfWeek, 'openTime', e.target.value)}
                      style={{ ...inputStyle, width: 110, flexShrink: 0 }}
                      className="form-input"
                    />
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>→</span>
                    <input
                      type="time"
                      value={h.closeTime}
                      onChange={e => updateHour(h.dayOfWeek, 'closeTime', e.target.value)}
                      style={{ ...inputStyle, width: 110, flexShrink: 0 }}
                      className="form-input"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {hoursError && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 12 }}>{hoursError}</p>}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
            {hoursOk && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#10b981' }}>
                <CheckCircle size={14} /> Horaires enregistrés
              </span>
            )}
            <button
              onClick={saveHours}
              disabled={savingHours}
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 20px', borderRadius: 7, border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: savingHours ? 'not-allowed' : 'pointer', opacity: savingHours ? 0.7 : 1, fontFamily: 'var(--font-body)' }}
            >
              {savingHours && <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />}
              Enregistrer les horaires
            </button>
          </div>
        </SectionCard>

        {garage && (
          <SectionCard title="Informations du compte">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>ID du garage</span>
                <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>#{garageId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Statut de vérification</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 7px', borderRadius: 4,
                  backgroundColor: garage.verified ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                  color: garage.verified ? '#10b981' : '#f59e0b',
                  fontSize: 11, fontWeight: 600,
                }}>
                  {garage.verified ? 'Vérifié' : 'En attente'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Membre depuis</span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {new Date(garage.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </SectionCard>
        )}

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
