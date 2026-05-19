'use client'

import { useState, FormEvent, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

const inputStyle: React.CSSProperties = {
  width:           '100%',
  height:          40,
  padding:         '0 12px',
  backgroundColor: 'var(--bg-elevated)',
  border:          '1px solid var(--border)',
  borderRadius:    8,
  color:           'var(--text-primary)',
  fontSize:        14,
  outline:         'none',
  transition:      'border-color 150ms ease',
  fontFamily:      'var(--font-body, "DM Sans", sans-serif)',
}

const labelStyle: React.CSSProperties = {
  fontSize:      11,
  fontWeight:    600,
  color:         'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
}

// ─── Contenu principal ────────────────────────────────────────────────────────

function ResetPasswordContent() {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const token       = searchParams.get('token') ?? ''

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [showConf,  setShowConf]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  // Token manquant ou invalide
  if (!token) {
    return (
      <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border:          '1px solid var(--border)',
            borderRadius:    14,
            padding:         '40px 32px',
            display:         'flex',
            flexDirection:   'column',
            alignItems:      'center',
            gap:             16,
          }}
        >
          <span
            style={{
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              width:           56,
              height:          56,
              borderRadius:    '50%',
              backgroundColor: 'var(--warning-muted)',
            }}
          >
            <AlertTriangle size={26} style={{ color: 'var(--warning)' }} strokeWidth={1.75} />
          </span>
          <h1
            className="font-display"
            style={{ fontSize: 22, fontStyle: 'italic', fontWeight: 400, color: 'var(--text-primary)', letterSpacing: '-0.015em' }}
          >
            Lien invalide ou expiré
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Ce lien de réinitialisation est invalide ou a expiré. Faites une nouvelle demande.
          </p>
          <Link
            href="/forgot-password"
            style={{
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              width:           '100%',
              height:          42,
              borderRadius:    8,
              backgroundColor: 'var(--accent)',
              color:           '#FFF',
              fontSize:        14,
              fontWeight:      500,
              textDecoration:  'none',
              marginTop:       8,
            }}
          >
            Nouvelle demande
          </Link>
        </div>
      </div>
    )
  }

  // ── Succès ──
  if (done) {
    return (
      <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border:          '1px solid var(--border)',
            borderRadius:    14,
            padding:         '40px 32px',
            display:         'flex',
            flexDirection:   'column',
            alignItems:      'center',
            gap:             16,
          }}
        >
          <span
            style={{
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              width:           56,
              height:          56,
              borderRadius:    '50%',
              backgroundColor: 'var(--success-muted)',
            }}
          >
            <CheckCircle2 size={28} style={{ color: 'var(--success)' }} strokeWidth={1.75} />
          </span>
          <h1
            className="font-display"
            style={{ fontSize: 24, fontStyle: 'italic', fontWeight: 400, color: 'var(--text-primary)', letterSpacing: '-0.015em' }}
          >
            Mot de passe mis à jour !
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.
          </p>
          <Link
            href="/login"
            style={{
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              width:           '100%',
              height:          42,
              borderRadius:    8,
              backgroundColor: 'var(--accent)',
              color:           '#FFF',
              fontSize:        14,
              fontWeight:      500,
              textDecoration:  'none',
              marginTop:       8,
            }}
          >
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(
        `${API}/api/v1/auth/reset-password?token=${encodeURIComponent(token)}&newPassword=${encodeURIComponent(password)}`,
        { method: 'POST' }
      )

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string }
        setError(body.message ?? 'Une erreur est survenue.')
        return
      }

      setDone(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch {
      setError('Impossible de contacter le serveur.')
    } finally {
      setLoading(false)
    }
  }

  const mismatch = confirm.length > 0 && password !== confirm

  return (
    <>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ width: '100%', maxWidth: 440 }}>
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border:          '1px solid var(--border)',
            borderRadius:    14,
            padding:         '36px 32px',
          }}
        >
          <h1
            className="font-display"
            style={{
              fontSize:      26,
              fontStyle:     'italic',
              fontWeight:    400,
              color:         'var(--text-primary)',
              letterSpacing: '-0.015em',
              lineHeight:    1.2,
              marginBottom:  8,
            }}
          >
            Nouveau mot de passe
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
            Choisissez un mot de passe fort (8 caractères minimum).
          </p>

          {error && (
            <div
              style={{
                padding:         '10px 12px',
                borderRadius:    8,
                marginBottom:    20,
                backgroundColor: 'var(--danger-muted)',
                border:          '1px solid rgba(184,48,53,0.22)',
                fontSize:        13,
                color:           'var(--danger)',
                lineHeight:      1.5,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* New password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="new-password" style={labelStyle}>Nouveau mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="new-password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="8 caractères minimum"
                  required
                  autoComplete="new-password"
                  style={{ ...inputStyle, paddingRight: 40 }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                  onBlur={e  => { e.currentTarget.style.borderColor = 'var(--border)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? 'Masquer' : 'Afficher'}
                  style={{
                    position:       'absolute',
                    right:          10,
                    top:            '50%',
                    transform:      'translateY(-50%)',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    width:          24,
                    height:         24,
                    border:         'none',
                    background:     'transparent',
                    color:          'var(--text-muted)',
                    cursor:         'pointer',
                    padding:        0,
                  }}
                >
                  {showPwd ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="confirm-password" style={labelStyle}>Confirmer le mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirm-password"
                  type={showConf ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  required
                  autoComplete="new-password"
                  style={{
                    ...inputStyle,
                    paddingRight: 40,
                    borderColor:  mismatch ? 'var(--danger)' : undefined,
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = mismatch ? 'var(--danger)' : 'var(--accent)' }}
                  onBlur={e  => { e.currentTarget.style.borderColor = mismatch ? 'var(--danger)' : 'var(--border)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConf(v => !v)}
                  aria-label={showConf ? 'Masquer' : 'Afficher'}
                  style={{
                    position:       'absolute',
                    right:          10,
                    top:            '50%',
                    transform:      'translateY(-50%)',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    width:          24,
                    height:         24,
                    border:         'none',
                    background:     'transparent',
                    color:          'var(--text-muted)',
                    cursor:         'pointer',
                    padding:        0,
                  }}
                >
                  {showConf ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
                </button>
              </div>
              {mismatch && (
                <span style={{ fontSize: 11, color: 'var(--danger)' }}>
                  Les mots de passe ne correspondent pas.
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || mismatch}
              style={{
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                gap:             8,
                width:           '100%',
                height:          42,
                borderRadius:    8,
                border:          'none',
                backgroundColor: 'var(--accent)',
                color:           '#FFF',
                fontSize:        14,
                fontWeight:      500,
                cursor:          (loading || mismatch) ? 'not-allowed' : 'pointer',
                opacity:         (loading || mismatch) ? 0.6 : 1,
                transition:      'opacity 150ms ease',
                fontFamily:      'var(--font-body, "DM Sans", sans-serif)',
              }}
            >
              {loading
                ? <><Loader2 size={15} strokeWidth={2} style={{ animation: 'spin 0.8s linear infinite' }} /> Enregistrement…</>
                : 'Enregistrer le mot de passe'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

// ─── Page (Suspense pour useSearchParams) ─────────────────────────────────────

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-secondary)', fontSize: 14 }}>
          <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--accent)' }} />
          Chargement…
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
