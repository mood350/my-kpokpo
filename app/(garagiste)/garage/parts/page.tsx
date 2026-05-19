'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package, Search, Plus, Pencil, AlertTriangle, RefreshCw, X, Loader2,
  SlidersHorizontal,
} from 'lucide-react'
import {
  authHeaders, fetchMe, fetchPartsByGarage,
  type SparePartResponse,
} from '@/lib/api'

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

interface PartForm {
  name:              string
  reference:         string
  category:          string
  brand:             string
  unit:              string
  minStockThreshold: string
  purchasePrice:     string
  sellingPrice:      string
}

const EMPTY_FORM: PartForm = {
  name: '', reference: '', category: '', brand: '',
  unit: 'pièce', minStockThreshold: '1', purchasePrice: '', sellingPrice: '',
}

interface MovementForm {
  type:     'IN' | 'OUT' | 'ADJUSTMENT'
  quantity: string
  reason:   string
}

const EMPTY_MOVEMENT: MovementForm = { type: 'IN', quantity: '', reason: '' }

function partToForm(p: SparePartResponse): PartForm {
  return {
    name:              p.name,
    reference:         p.reference,
    category:          p.category,
    brand:             p.brand ?? '',
    unit:              p.unit,
    minStockThreshold: String(p.minStockThreshold),
    purchasePrice:     p.purchasePrice != null ? String(p.purchasePrice) : '',
    sellingPrice:      p.sellingPrice  != null ? String(p.sellingPrice)  : '',
  }
}

function fmt(n: number | null, suffix = ''): string {
  if (n == null) return '—'
  return n.toLocaleString('fr-FR') + suffix
}

export default function GaragistePartsPage() {
  const router = useRouter()

  const [parts,      setParts]      = useState<SparePartResponse[]>([])
  const [loading,    setLoading]    = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [search,     setSearch]     = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  const [showPartModal,      setShowPartModal]      = useState(false)
  const [showMovementModal,  setShowMovementModal]  = useState(false)
  const [editTarget,         setEditTarget]         = useState<SparePartResponse | null>(null)
  const [movementTarget,     setMovementTarget]     = useState<SparePartResponse | null>(null)

  const [form,         setForm]         = useState<PartForm>(EMPTY_FORM)
  const [movementForm, setMovementForm] = useState<MovementForm>(EMPTY_MOVEMENT)
  const [saving,       setSaving]       = useState(false)
  const [formError,    setFormError]    = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setFetchError(null)
    try {
      const me = await fetchMe()
      if (!me.garageId) { setFetchError('Aucun garage associé à votre compte.'); return }
      const list = await fetchPartsByGarage(me.garageId)
      setParts(list)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue'
      if (msg.includes('401')) { router.push('/login?redirect=/garage/parts'); return }
      setFetchError(msg)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowPartModal(false); setShowMovementModal(false) }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  const q = search.toLowerCase().trim()
  const filtered = parts.filter(p => {
    if (lowStockOnly && !p.lowStock) return false
    if (!q) return true
    return p.name.toLowerCase().includes(q) ||
           p.reference.toLowerCase().includes(q) ||
           p.category.toLowerCase().includes(q) ||
           (p.brand ?? '').toLowerCase().includes(q)
  })

  const lowStockCount = parts.filter(p => p.lowStock).length

  function openAdd() {
    setEditTarget(null); setForm(EMPTY_FORM); setFormError(null); setShowPartModal(true)
  }

  function openEdit(p: SparePartResponse) {
    setEditTarget(p); setForm(partToForm(p)); setFormError(null); setShowPartModal(true)
  }

  function openMovement(p: SparePartResponse) {
    setMovementTarget(p); setMovementForm(EMPTY_MOVEMENT); setFormError(null); setShowMovementModal(true)
  }

  async function handleSavePart() {
    setFormError(null)
    if (!form.name.trim() || !form.reference.trim() || !form.category.trim()) {
      setFormError('Le nom, la référence et la catégorie sont obligatoires.'); return
    }
    setSaving(true)
    try {
      const url    = editTarget ? `${API}/api/v1/parts/${editTarget.id}` : `${API}/api/v1/parts`
      const method = editTarget ? 'PUT' : 'POST'
      const payload = {
        name:              form.name.trim(),
        reference:         form.reference.trim(),
        category:          form.category.trim(),
        brand:             form.brand.trim() || null,
        unit:              form.unit.trim() || 'pièce',
        minStockThreshold: Number(form.minStockThreshold) || 1,
        purchasePrice:     form.purchasePrice ? Number(form.purchasePrice) : null,
        sellingPrice:      form.sellingPrice  ? Number(form.sellingPrice)  : null,
      }
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) })
      if (res.status === 401) { router.push('/login'); return }
      if (!res.ok) {
        const b = await res.json().catch(() => ({})) as { message?: string }
        setFormError(b.message ?? `Erreur ${res.status}`); return
      }
      const saved = await res.json() as SparePartResponse
      setParts(prev => editTarget
        ? prev.map(p => p.id === saved.id ? saved : p)
        : [saved, ...prev]
      )
      setShowPartModal(false)
    } catch {
      setFormError('Impossible de contacter le serveur.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveMovement() {
    if (!movementTarget) return
    setFormError(null)
    if (!movementForm.quantity || Number(movementForm.quantity) <= 0) {
      setFormError('La quantité doit être supérieure à 0.'); return
    }
    setSaving(true)
    try {
      const res = await fetch(`${API}/api/v1/parts/${movementTarget.id}/movements`, {
        method:  'POST',
        headers: authHeaders(),
        body:    JSON.stringify({
          type:     movementForm.type,
          quantity: Number(movementForm.quantity),
          reason:   movementForm.reason.trim() || null,
        }),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({})) as { message?: string }
        setFormError(b.message ?? `Erreur ${res.status}`); return
      }
      await load()
      setShowMovementModal(false)
    } catch {
      setFormError('Impossible de contacter le serveur.')
    } finally {
      setSaving(false)
    }
  }

  function field(key: keyof PartForm, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <>
      <style>{`
        .part-row:hover { background-color: var(--bg-elevated); }
        .action-btn { opacity: 0; transition: opacity 150ms ease; }
        .part-row:hover .action-btn { opacity: 1; }
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
          width: 100%; max-width: 560px;
          max-height: 90vh; overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
        }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 520px) { .form-grid { grid-template-columns: 1fr; } }
        .form-input:focus { border-color: var(--accent) !important; }
        .form-select:focus { border-color: var(--accent) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 2px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 className="font-display" style={{ fontSize: 22, fontWeight: 400, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Stock pièces
              </h2>
              {!loading && !fetchError && (
                <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 8px', borderRadius: 11, backgroundColor: 'var(--accent-muted)', color: 'var(--accent)', fontSize: 12, fontWeight: 600 }}>
                  {parts.length}
                </span>
              )}
              {!loading && lowStockCount > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 8px', borderRadius: 11, backgroundColor: 'rgba(239,68,68,0.12)', color: 'var(--danger)', fontSize: 12, fontWeight: 600 }}>
                  {lowStockCount} alerte{lowStockCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              Gérez le stock de pièces de votre garage.
            </p>
          </div>
          <button
            onClick={openAdd}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', borderRadius: 8, border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--font-body)' }}
          >
            <Plus size={15} strokeWidth={2} /> Ajouter une pièce
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={14} strokeWidth={1.75} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher nom, référence, catégorie…"
              style={{ ...inputStyle, paddingLeft: 32 }} className="form-input"
            />
          </div>
          <button
            onClick={() => setLowStockOnly(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 14px',
              borderRadius: 7, border: '1px solid var(--border)', cursor: 'pointer',
              backgroundColor: lowStockOnly ? 'rgba(239,68,68,0.1)' : 'transparent',
              color: lowStockOnly ? 'var(--danger)' : 'var(--text-secondary)',
              fontSize: 13, fontFamily: 'var(--font-body)',
            }}
          >
            <AlertTriangle size={13} /> Alertes seulement
          </button>
        </div>

        {loading ? (
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 20px', borderBottom: i < 4 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
                {[140, 100, 80, 70, 70, 70, 60].map((w, j) => (
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
            <Package size={36} strokeWidth={1.2} style={{ color: 'var(--text-muted)' }} />
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
              {search || lowStockOnly ? 'Aucun résultat' : 'Aucune pièce en stock'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {search || lowStockOnly ? 'Modifiez vos filtres.' : 'Ajoutez votre première pièce.'}
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 80px 80px 80px auto', gap: 16, padding: '10px 20px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)' }}>
              {['Pièce', 'Référence / Cat.', 'Marque', 'Stock', 'Min', 'Vente', ''].map((h, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
              ))}
            </div>

            {filtered.map((part, idx) => (
              <div
                key={part.id}
                className="part-row"
                style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 80px 80px 80px auto', gap: 16, padding: '13px 20px', borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', transition: 'background-color 150ms ease' }}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{part.name}</p>
                  {part.lowStock && (
                    <span style={{ fontSize: 10, color: 'var(--danger)', fontWeight: 600 }}>Stock bas</span>
                  )}
                </div>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-primary)' }}>{part.reference}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{part.category}</p>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{part.brand || '—'}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: part.lowStock ? 'var(--danger)' : 'var(--text-primary)' }}>
                  {part.currentStock} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>{part.unit}</span>
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{part.minStockThreshold}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fmt(part.sellingPrice, ' F')}</p>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className="action-btn"
                    onClick={() => openMovement(part)}
                    title="Mouvement de stock"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    <SlidersHorizontal size={12} />
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => openEdit(part)}
                    title="Modifier"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    <Pencil size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPartModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowPartModal(false) }}>
          <div className="modal-card">
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                {editTarget ? 'Modifier la pièce' : 'Ajouter une pièce'}
              </h2>
              <button onClick={() => setShowPartModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: '1/-1' }}>
                  <label style={labelStyle}>Nom *</label>
                  <input value={form.name} onChange={e => field('name', e.target.value)} style={inputStyle} className="form-input" placeholder="Filtre à huile" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={labelStyle}>Référence *</label>
                  <input value={form.reference} onChange={e => field('reference', e.target.value)} style={inputStyle} className="form-input" placeholder="FH-2241" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={labelStyle}>Catégorie *</label>
                  <input value={form.category} onChange={e => field('category', e.target.value)} style={inputStyle} className="form-input" placeholder="Filtration" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={labelStyle}>Marque</label>
                  <input value={form.brand} onChange={e => field('brand', e.target.value)} style={inputStyle} className="form-input" placeholder="Bosch" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={labelStyle}>Unité</label>
                  <input value={form.unit} onChange={e => field('unit', e.target.value)} style={inputStyle} className="form-input" placeholder="pièce" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={labelStyle}>Stock minimum</label>
                  <input type="number" min="0" value={form.minStockThreshold} onChange={e => field('minStockThreshold', e.target.value)} style={inputStyle} className="form-input" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={labelStyle}>Prix achat (FCFA)</label>
                  <input type="number" min="0" value={form.purchasePrice} onChange={e => field('purchasePrice', e.target.value)} style={inputStyle} className="form-input" placeholder="0" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={labelStyle}>Prix vente (FCFA)</label>
                  <input type="number" min="0" value={form.sellingPrice} onChange={e => field('sellingPrice', e.target.value)} style={inputStyle} className="form-input" placeholder="0" />
                </div>
              </div>

              {formError && <p style={{ fontSize: 12, color: 'var(--danger)' }}>{formError}</p>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                <button onClick={() => setShowPartModal(false)} style={{ height: 38, padding: '0 16px', borderRadius: 7, border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  Annuler
                </button>
                <button onClick={handleSavePart} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 20px', borderRadius: 7, border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'var(--font-body)' }}>
                  {saving && <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />}
                  {editTarget ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMovementModal && movementTarget && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowMovementModal(false) }}>
          <div className="modal-card" style={{ maxWidth: 400 }}>
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Mouvement de stock</h2>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{movementTarget.name}</p>
              </div>
              <button onClick={() => setShowMovementModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['IN', 'OUT', 'ADJUSTMENT'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setMovementForm(f => ({ ...f, type: t }))}
                    style={{
                      flex: 1, height: 38, borderRadius: 7, border: '1px solid var(--border)', cursor: 'pointer',
                      backgroundColor: movementForm.type === t ? 'var(--accent)' : 'transparent',
                      color:           movementForm.type === t ? '#fff' : 'var(--text-secondary)',
                      fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-body)',
                      transition: 'background-color 150ms ease, color 150ms ease',
                    }}
                  >
                    {t === 'IN' ? 'Entrée' : t === 'OUT' ? 'Sortie' : 'Ajustement'}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Quantité *</label>
                <input
                  type="number" min="1"
                  value={movementForm.quantity}
                  onChange={e => setMovementForm(f => ({ ...f, quantity: e.target.value }))}
                  style={inputStyle} className="form-input"
                  placeholder="1"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Motif</label>
                <input
                  value={movementForm.reason}
                  onChange={e => setMovementForm(f => ({ ...f, reason: e.target.value }))}
                  style={inputStyle} className="form-input"
                  placeholder="Livraison fournisseur, utilisation intervention…"
                />
              </div>

              <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: 'var(--bg-elevated)', fontSize: 13, color: 'var(--text-secondary)' }}>
                Stock actuel : <strong style={{ color: 'var(--text-primary)' }}>{movementTarget.currentStock} {movementTarget.unit}</strong>
              </div>

              {formError && <p style={{ fontSize: 12, color: 'var(--danger)' }}>{formError}</p>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                <button onClick={() => setShowMovementModal(false)} style={{ height: 38, padding: '0 16px', borderRadius: 7, border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  Annuler
                </button>
                <button onClick={handleSaveMovement} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 20px', borderRadius: 7, border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'var(--font-body)' }}>
                  {saving && <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />}
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
