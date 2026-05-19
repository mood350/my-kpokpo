'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, Search, Plus, Pencil, Trash2, AlertTriangle, RefreshCw, X, Loader2,
} from 'lucide-react'
import {
  authHeaders, fetchMe, fetchTechniciansByGarage,
  type TechnicianResponse,
} from '@/lib/api'

// ─── Constants ────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

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

interface TechForm {
  firstName: string
  lastName:  string
  email:     string
  specialty: string
}

const EMPTY_FORM: TechForm = { firstName: '', lastName: '', email: '', specialty: '' }

function techToForm(t: TechnicianResponse): TechForm {
  return {
    firstName: t.firstName,
    lastName:  t.lastName,
    email:     t.email ?? '',
    specialty: t.specialty ?? '',
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GaragisteTechniciansPage() {
  const router = useRouter()

  const [techs,      setTechs]      = useState<TechnicianResponse[]>([])
  const [loading,    setLoading]    = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [search,     setSearch]     = useState('')

  const [showModal,    setShowModal]    = useState(false)
  const [editTarget,   setEditTarget]   = useState<TechnicianResponse | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TechnicianResponse | null>(null)

  const [form,      setForm]      = useState<TechForm>(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setFetchError(null)
    try {
      const me = await fetchMe()
      if (!me.garageId) { setFetchError('Aucun garage associé à votre compte.'); return }
      const list = await fetchTechniciansByGarage(me.garageId)
      setTechs(list)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue'
      if (msg.includes('401')) { router.push('/login?redirect=/garage/technicians'); return }
      setFetchError(msg)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowModal(false); setDeleteTarget(null) }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  const q = search.toLowerCase().trim()
  const filtered = q
    ? techs.filter(t =>
        `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
        (t.specialty ?? '').toLowerCase().includes(q) ||
        (t.email ?? '').toLowerCase().includes(q)
      )
    : techs

  function openAdd() {
    setEditTarget(null); setForm(EMPTY_FORM); setFormError(null); setShowModal(true)
  }

  function openEdit(t: TechnicianResponse) {
    setEditTarget(t); setForm(techToForm(t)); setFormError(null); setShowModal(true)
  }

  async function handleSave() {
    setFormError(null)
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setFormError('Le prénom et le nom sont obligatoires.'); return
    }

    setSaving(true)
    try {
      const url    = editTarget ? `${API}/api/v1/technicians/${editTarget.id}` : `${API}/api/v1/technicians`
      const method = editTarget ? 'PUT' : 'POST'

      const payload = editTarget
        ? { specialty: form.specialty.trim() || null, available: editTarget.available }
        : { firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim() || null, specialty: form.specialty.trim() || null }

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body:    JSON.stringify(payload),
      })
      if (res.status === 401) { router.push('/login'); return }
      if (!res.ok) {
        const b = await res.json().catch(() => ({})) as { message?: string }
        setFormError(b.message ?? `Erreur ${res.status}`); return
      }
      const saved = await res.json() as TechnicianResponse
      if (editTarget) {
        setTechs(prev => prev.map(t => t.id === saved.id ? saved : t))
      } else {
        setTechs(prev => [saved, ...prev])
      }
      setShowModal(false)
    } catch {
      setFormError('Impossible de contacter le serveur.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleAvailability(tech: TechnicianResponse) {
    try {
      const res = await fetch(`${API}/api/v1/technicians/${tech.id}`, {
        method:  'PUT',
        headers: authHeaders(),
        body:    JSON.stringify({ specialty: tech.specialty, available: !tech.available }),
      })
      if (!res.ok) return
      const updated = await res.json() as TechnicianResponse
      setTechs(prev => prev.map(t => t.id === updated.id ? updated : t))
    } catch { /* silent */ }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`${API}/api/v1/technicians/${deleteTarget.id}`, {
        method: 'DELETE', headers: authHeaders(),
      })
      if (res.status === 401) { router.push('/login'); return }
      if (!res.ok && res.status !== 204) { alert(`Erreur ${res.status}`); return }
      setTechs(prev => prev.filter(t => t.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch {
      alert('Impossible de contacter le serveur.')
    } finally {
      setDeleting(false)
    }
  }

  function field(key: keyof TechForm, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <>
      <style>{`
        .tech-row:hover { background-color: var(--bg-elevated); }
        .action-btn { opacity: 0; transition: opacity 150ms ease; }
        .tech-row:hover .action-btn { opacity: 1; }
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
          width: 100%; max-width: 480px;
          max-height: 90vh; overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
        }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 520px) { .form-grid { grid-template-columns: 1fr; } }
        .form-input:focus { border-color: var(--accent) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 2px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 className="font-display" style={{ fontSize: 22, fontWeight: 400, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Techniciens
              </h2>
              {!loading && !fetchError && (
                <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 8px', borderRadius: 11, backgroundColor: 'var(--accent-muted)', color: 'var(--accent)', fontSize: 12, fontWeight: 600 }}>
                  {techs.length}
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              Gérez l&apos;équipe de votre garage.
            </p>
          </div>
          <button
            onClick={openAdd}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', borderRadius: 8, border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--font-body)' }}
          >
            <Plus size={15} strokeWidth={2} />
            Ajouter un technicien
          </button>
        </div>

        <div style={{ position: 'relative', maxWidth: 360 }}>
          <Search size={14} strokeWidth={1.75} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, spécialité…"
            style={{ ...inputStyle, paddingLeft: 32 }} className="form-input"
          />
        </div>

        {loading ? (
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 20px', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
                {[140, 100, 120, 80].map((w, j) => (
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
            <Users size={36} strokeWidth={1.2} style={{ color: 'var(--text-muted)' }} />
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
              {search ? 'Aucun résultat' : 'Aucun technicien'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {search ? 'Modifiez votre recherche.' : 'Ajoutez votre premier technicien.'}
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr auto', gap: 16, padding: '10px 20px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)' }}>
              {['Nom', 'Spécialité', 'Email', 'Disponible', ''].map((h, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
              ))}
            </div>

            {filtered.map((tech, idx) => (
              <div
                key={tech.id}
                className="tech-row"
                style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr auto', gap: 16, padding: '13px 20px', borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', transition: 'background-color 150ms ease' }}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {tech.firstName} {tech.lastName}
                  </p>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {tech.specialty || '—'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {tech.email || '—'}
                </p>
                <button
                  onClick={() => toggleAvailability(tech)}
                  style={{
                    display:         'inline-flex',
                    alignItems:      'center',
                    height:          22,
                    padding:         '0 8px',
                    borderRadius:    11,
                    border:          'none',
                    cursor:          'pointer',
                    fontSize:        11,
                    fontWeight:      600,
                    backgroundColor: tech.available ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)',
                    color:           tech.available ? '#10b981' : '#6b7280',
                    fontFamily:      'var(--font-body)',
                  }}
                >
                  {tech.available ? 'Disponible' : 'Indisponible'}
                </button>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className="action-btn"
                    onClick={() => openEdit(tech)}
                    title="Modifier"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => setDeleteTarget(tech)}
                    title="Supprimer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)', color: 'var(--danger)', cursor: 'pointer' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal-card">
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                {editTarget ? 'Modifier le technicien' : 'Ajouter un technicien'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {!editTarget && (
                <div className="form-grid">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle}>Prénom *</label>
                    <input value={form.firstName} onChange={e => field('firstName', e.target.value)} style={inputStyle} className="form-input" placeholder="Jean" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle}>Nom *</label>
                    <input value={form.lastName} onChange={e => field('lastName', e.target.value)} style={inputStyle} className="form-input" placeholder="Dupont" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: '1/-1' }}>
                    <label style={labelStyle}>Email</label>
                    <input type="email" value={form.email} onChange={e => field('email', e.target.value)} style={inputStyle} className="form-input" placeholder="jean@garage.com" />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Spécialité</label>
                <input value={form.specialty} onChange={e => field('specialty', e.target.value)} style={inputStyle} className="form-input" placeholder="Électricité, Mécanique générale…" />
              </div>

              {formError && <p style={{ fontSize: 12, color: 'var(--danger)' }}>{formError}</p>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
                <button onClick={() => setShowModal(false)} style={{ height: 38, padding: '0 16px', borderRadius: 7, border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 20px', borderRadius: 7, border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'var(--font-body)' }}
                >
                  {saving && <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />}
                  {editTarget ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null) }}>
          <div className="modal-card" style={{ maxWidth: 400 }}>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.12)', flexShrink: 0 }}>
                  <Trash2 size={18} style={{ color: 'var(--danger)' }} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Retirer le technicien</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {deleteTarget.firstName} {deleteTarget.lastName} sera retiré de votre équipe.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => setDeleteTarget(null)} style={{ height: 36, padding: '0 14px', borderRadius: 7, border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  Annuler
                </button>
                <button onClick={handleDelete} disabled={deleting} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 16px', borderRadius: 7, border: 'none', backgroundColor: 'var(--danger)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1, fontFamily: 'var(--font-body)' }}>
                  {deleting && <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />}
                  Retirer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
