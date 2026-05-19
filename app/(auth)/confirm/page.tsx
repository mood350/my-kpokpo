'use client'

import { useState, useEffect, useRef, FormEvent, KeyboardEvent, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

// ─── Contenu principal ────────────────────────────────────────────────────────

function ConfirmContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const urlToken = searchParams.get('token') ?? ''

  const [digits,       setDigits]       = useState(['', '', '', '', '', ''])
  const [loading,      setLoading]      = useState(false)
  const [status,       setStatus]       = useState<'idle' | 'success' | 'error'>('idle')
  const [errMsg,       setErrMsg]       = useState('')
  const [resendState,  setResendState]  = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [cooldown,     setCooldown]     = useState(0)

  const refs      = useRef<(HTMLInputElement | null)[]>([])
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }
  }, [])

  async function handleResend() {
    if (!email || cooldown > 0 || resendState === 'sending') return
    setResendState('sending')
    try {
      const res = await fetch(
        `${API}/api/v1/auth/resend-confirmation?email=${encodeURIComponent(email)}`,
        { method: 'POST' }
      )
      if (!res.ok) {
        setResendState('error')
        return
      }
      setResendState('sent')
      setCooldown(60)
      cooldownRef.current = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) { clearInterval(cooldownRef.current!); return 0 }
          return prev - 1
        })
      }, 1000)
    } catch {
      setResendState('error')
    }
  }

  // Auto-confirm si le lien desktop contient un token UUID
  useEffect(() => {
    if (urlToken && urlToken.length > 10) {
      submitToken(urlToken)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlToken])

  async function submitToken(token: string) {
    setLoading(true)
    setErrMsg('')
    try {
      const res = await fetch(`${API}/api/v1/auth/confirm?token=${encodeURIComponent(token)}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string }
        setErrMsg(body.message ?? 'Code invalide ou expiré.')
        setStatus('error')
        return
      }
      setStatus('success')
    } catch {
      setErrMsg('Impossible de contacter le serveur.')
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  function handleDigitChange(i: number, value: string) {
    if (!/^[0-9]?$/.test(value)) return
    const next = [...digits]
    next[i] = value
    setDigits(next)
    if (value && i < 5) refs.current[i + 1]?.focus()
  }

  function handleKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      e.preventDefault()
      setDigits(pasted.split(''))
      refs.current[5]?.focus()
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const code = digits.join('')
    if (code.length < 6) return
    await submitToken(code)
  }

  // ── Succès ──
  if (status === 'success') {
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
            Compte activé !
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Votre compte MyKpokpo est actif. Vous pouvez maintenant vous connecter.
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
            Accéder à mon espace
          </Link>
        </div>
      </div>
    )
  }

  // ── Auto-confirm en cours (lien UUID) ──
  if (loading && !digits.some(Boolean)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Activation de votre compte…</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ── Formulaire OTP ──
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
          {/* Icon */}
          <span
            style={{
              display:         'inline-flex',
              alignItems:      'center',
              justifyContent:  'center',
              width:           44,
              height:          44,
              borderRadius:    '50%',
              backgroundColor: 'var(--accent-muted)',
              marginBottom:    16,
            }}
          >
            <span style={{ fontSize: 20 }}>✉</span>
          </span>

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
            Vérifiez votre email
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
            Un code à 6 chiffres a été envoyé à{' '}
            {email
              ? <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
              : 'votre adresse email'}
            .
          </p>

          {/* Error */}
          {status === 'error' && (
            <div
              style={{
                display:         'flex',
                alignItems:      'flex-start',
                gap:             8,
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
              <XCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              {errMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* OTP inputs */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { refs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  aria-label={`Chiffre ${i + 1}`}
                  style={{
                    width:           48,
                    height:          56,
                    textAlign:       'center',
                    fontSize:        22,
                    fontWeight:      600,
                    backgroundColor: 'var(--bg-elevated)',
                    border:          `2px solid ${d ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius:    10,
                    color:           'var(--text-primary)',
                    outline:         'none',
                    caretColor:      'var(--accent)',
                    transition:      'border-color 150ms ease',
                    fontFamily:      'var(--font-body, "DM Sans", sans-serif)',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                  onBlur={e  => { e.currentTarget.style.borderColor = d ? 'var(--accent)' : 'var(--border)' }}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || digits.join('').length < 6}
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
                cursor:          (loading || digits.join('').length < 6) ? 'not-allowed' : 'pointer',
                opacity:         (loading || digits.join('').length < 6) ? 0.55 : 1,
                transition:      'opacity 150ms ease',
                fontFamily:      'var(--font-body, "DM Sans", sans-serif)',
              }}
            >
              {loading
                ? <><Loader2 size={15} strokeWidth={2} style={{ animation: 'spin 0.8s linear infinite' }} /> Vérification…</>
                : 'Confirmer le code'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
          <span>Pas reçu ?{' '}</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={!email || cooldown > 0 || resendState === 'sending'}
            style={{
              background:    'none',
              border:        'none',
              padding:       0,
              cursor:        (!email || cooldown > 0 || resendState === 'sending') ? 'not-allowed' : 'pointer',
              color:         cooldown > 0 ? 'var(--text-muted)' : 'var(--accent)',
              fontWeight:    500,
              fontSize:      13,
              fontFamily:    'inherit',
              opacity:       (!email || cooldown > 0) ? 0.6 : 1,
            }}
          >
            {resendState === 'sending'
              ? 'Envoi…'
              : cooldown > 0
                ? `Renvoyer (${cooldown}s)`
                : 'Renvoyer le code'}
          </button>
          {resendState === 'sent' && cooldown > 0 && (
            <span style={{ display: 'block', marginTop: 6, fontSize: 12, color: 'var(--success)' }}>
              Code renvoyé — vérifiez votre boîte mail.
            </span>
          )}
          {resendState === 'error' && (
            <span style={{ display: 'block', marginTop: 6, fontSize: 12, color: 'var(--danger)' }}>
              Échec de l&apos;envoi. Réessayez.
            </span>
          )}
          <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>·</span>
          <Link href="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            Retour
          </Link>
        </div>
      </div>
    </>
  )
}

// ─── Page (wraps Suspense pour useSearchParams) ───────────────────────────────

export default function ConfirmPage() {
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
      <ConfirmContent />
    </Suspense>
  )
}
