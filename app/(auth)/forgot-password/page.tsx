'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'

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

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(
        `${API}/api/v1/auth/forgot-password?email=${encodeURIComponent(email)}`,
        { method: 'POST' }
      )

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string }
        setError(body.message ?? 'Une erreur est survenue.')
        return
      }

      setSent(true)
    } catch {
      setError('Impossible de contacter le serveur.')
    } finally {
      setLoading(false)
    }
  }

  // ── Succès ──
  if (sent) {
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
            style={{
              fontSize:      24,
              fontStyle:     'italic',
              fontWeight:    400,
              color:         'var(--text-primary)',
              letterSpacing: '-0.015em',
            }}
          >
            Email envoyé !
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 320 }}>
            Un lien de réinitialisation a été envoyé à{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
            Vérifiez aussi vos spams.
          </p>

          <Link
            href="/login"
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            6,
              fontSize:       13,
              color:          'var(--text-secondary)',
              textDecoration: 'none',
              marginTop:      8,
              fontWeight:     450,
            }}
          >
            <ArrowLeft size={14} strokeWidth={1.75} />
            Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  // ── Formulaire ──
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
            Mot de passe oublié ?
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
            Saisissez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label
                htmlFor="fp-email"
                style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}
              >
                Email
              </label>
              <input
                id="fp-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="kofi@mongarage.com"
                required
                autoComplete="email"
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                onBlur={e  => { e.currentTarget.style.borderColor = 'var(--border)' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
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
                cursor:          loading ? 'not-allowed' : 'pointer',
                opacity:         loading ? 0.7 : 1,
                transition:      'opacity 150ms ease',
                fontFamily:      'var(--font-body, "DM Sans", sans-serif)',
              }}
            >
              {loading
                ? <><Loader2 size={15} strokeWidth={2} style={{ animation: 'spin 0.8s linear infinite' }} /> Envoi en cours…</>
                : 'Envoyer le lien'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
          <Link
            href="/login"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', textDecoration: 'none' }}
          >
            <ArrowLeft size={13} strokeWidth={1.75} />
            Retour à la connexion
          </Link>
        </p>
      </div>
    </>
  )
}
