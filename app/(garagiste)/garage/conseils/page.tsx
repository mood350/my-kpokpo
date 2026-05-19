'use client'

import { useCallback, useEffect, useState } from 'react'
import { BookOpen, Plus, Trash2, X, Send } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

interface ConseilResponse {
  id:         number
  title:      string
  content:    string
  category:   string | null
  authorName: string
  published:  boolean
  createdAt:  string
}

const CATEGORIES = ['Moteur', 'Freins', 'Pneus', 'Carrosserie', 'Électronique', 'Entretien général']

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function categoryColor(cat: string | null): string {
  const map: Record<string, string> = {
    'Moteur':            'var(--warning)',
    'Freins':            'var(--danger)',
    'Pneus':             'var(--success)',
    'Carrosserie':       'var(--accent)',
    'Électronique':      '#6366f1',
    'Entretien général': 'var(--text-secondary)',
  }
  return cat ? (map[cat] ?? 'var(--accent)') : 'var(--accent)'
}

export default function GaragisteConseillsPage() {
  const [conseils,  setConseils]  = useState<ConseilResponse[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [deleting,  setDeleting]  = useState<number | null>(null)

  const [title,    setTitle]    = useState('')
  const [content,  setContent]  = useState('')
  const [category, setCategory] = useState('')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/v1/conseils/mine`, { headers: authHeaders() })
      if (res.ok) setConseils(await res.json())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate() {
    if (!title.trim() || !content.trim()) return
    setSaving(true); setError(null)
    try {
      const res = await fetch(`${API}/api/v1/conseils`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ title: title.trim(), content: content.trim(), category: category || null }),
      })
      if (!res.ok) { const b = await res.json(); throw new Error(b.message ?? 'Erreur'); }
      setTitle(''); setContent(''); setCategory(''); setShowForm(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    setDeleting(id)
    try {
      await fetch(`${API}/api/v1/conseils/${id}`, { method: 'DELETE', headers: authHeaders() })
      setConseils(prev => prev.filter(c => c.id !== id))
    } finally { setDeleting(null) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Conseils</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Publiez des conseils d'entretien visibles par tous les clients de l'application.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        >
          <Plus size={15} /> Nouveau conseil
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Nouveau conseil</span>
            <button onClick={() => { setShowForm(false); setError(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={16} />
            </button>
          </div>

          {error && (
            <div style={{ background: 'rgba(184,48,53,0.08)', color: 'var(--danger)', borderRadius: 6, padding: '8px 12px', fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Titre</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex : Comment vérifier la pression des pneus"
              style={{ padding: '8px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 6, backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Catégorie</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              style={{ padding: '8px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 6, backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none' }}>
              <option value="">— Choisir une catégorie —</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contenu</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Rédigez votre conseil d'entretien…" rows={6}
              style={{ padding: '8px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 6, backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={() => { setShowForm(false); setError(null) }} style={{ padding: '8px 16px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 6, background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Annuler
            </button>
            <button onClick={handleCreate} disabled={!title.trim() || !content.trim() || saving}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, fontWeight: 500, border: 'none', borderRadius: 6, backgroundColor: 'var(--accent)', color: '#fff', cursor: !title.trim() || !content.trim() || saving ? 'not-allowed' : 'pointer', opacity: !title.trim() || !content.trim() || saving ? 0.6 : 1 }}>
              <Send size={14} /> {saving ? 'Publication…' : 'Publier'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)', fontSize: 13 }}>Chargement…</div>
      ) : conseils.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <BookOpen size={40} strokeWidth={1} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Aucun conseil publié. Créez le premier !</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {conseils.map(c => (
            <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  {c.category && (
                    <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: categoryColor(c.category), backgroundColor: `${categoryColor(c.category)}18`, borderRadius: 4, padding: '2px 7px', marginBottom: 6 }}>
                      {c.category}
                    </span>
                  )}
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>{c.title}</p>
                </div>
                <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id} title="Supprimer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0, opacity: deleting === c.id ? 0.5 : 1 }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(184,48,53,0.08)'; e.currentTarget.style.color = 'var(--danger)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{c.content}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Par {c.authorName} · {formatDate(c.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
