'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { fetchMe } from '@/lib/api'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

const ROLE_HOME: Record<string, string> = {
  ADMIN:     '/dashboard',
  GARAGISTE: '/garage/dashboard',
}

const ERROR_MAP: Record<string, string> = {
  BAD_CREDENTIALS:  'Email ou mot de passe incorrect.',
  USER_NOT_FOUND:   'Aucun compte associé à cet email.',
  ACCESS_DENIED:    'Compte non activé — vérifiez votre boîte mail.',
  VALIDATION_ERROR: 'Données invalides. Vérifiez les champs.',
}

const CLIENT_MOBILE_ONLY =
  'Les comptes particuliers utilisent l’application mobile MyKpokpo. Téléchargez-la pour vous connecter.'

// ─── Styles partagés ──────────────────────────────────────────────────────────

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

// ─── Composant ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/v1/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { code?: string; message?: string }
        setError(ERROR_MAP[body.code ?? ''] ?? body.message ?? 'Une erreur est survenue.')
        return
      }

      const data = await res.json() as { access_token: string; refresh_token: string }
      localStorage.setItem('access_token',  data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      document.cookie = `auth_session=${data.refresh_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`

      const profile = await fetchMe()

      if (profile.role === 'CLIENT') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        document.cookie = 'auth_session=; path=/; max-age=0; SameSite=Strict'
        setError(CLIENT_MOBILE_ONLY)
        return
      }

      const target = ROLE_HOME[profile.role]
      if (!target) {
        setError('Rôle non reconnu pour la console web.')
        return
      }
      router.push(target)
    } catch {
      setError('Impossible de contacter le serveur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Card */}
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
              marginBottom:  6,
            }}
          >
            Connexion
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28 }}>
            Accédez à votre espace garage MyKpokpo.
          </p>

          {/* Error banner */}
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
            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="email" style={labelStyle}>Email</label>
              <input
                id="email"
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

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password" style={labelStyle}>Mot de passe</label>
                <Link
                  href="/forgot-password"
                  style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 450 }}
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{ ...inputStyle, paddingRight: 40 }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                  onBlur={e  => { e.currentTarget.style.borderColor = 'var(--border)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  style={{
                    position:        'absolute',
                    right:           10,
                    top:             '50%',
                    transform:       'translateY(-50%)',
                    display:         'flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                    width:           24,
                    height:          24,
                    border:          'none',
                    background:      'transparent',
                    color:           'var(--text-muted)',
                    cursor:          'pointer',
                    padding:         0,
                  }}
                >
                  {showPwd
                    ? <EyeOff size={15} strokeWidth={1.75} />
                    : <Eye    size={15} strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            {/* Submit */}
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
                marginTop:       4,
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
                ? <><Loader2 size={15} strokeWidth={2} style={{ animation: 'spin 0.8s linear infinite' }} /> Connexion…</>
                : 'Se connecter'}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
          Pas encore de compte ?{' '}
          <Link href="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            Créer un compte
          </Link>
        </p>
      </div>
    </>
  )
}
