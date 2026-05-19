'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, Wrench, Smartphone } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

const ERROR_MAP: Record<string, string> = {
  VALIDATION_ERROR: 'Données invalides. Vérifiez les champs.',
  INVALID_ARGUMENT: 'Informations manquantes ou incorrectes.',
}

// ─── Utilitaire force du mot de passe ────────────────────────────────────────

function passwordStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: '', color: 'var(--border)' }
  let s = 0
  if (pwd.length >= 8)           s++
  if (/[A-Z]/.test(pwd))         s++
  if (/[0-9]/.test(pwd))         s++
  if (/[^A-Za-z0-9]/.test(pwd)) s++
  return {
    score: s,
    label: ['Trop court', 'Faible', 'Moyen', 'Fort', 'Excellent'][s] ?? '',
    color: ['var(--danger)', 'var(--danger)', 'var(--warning)', 'var(--success)', 'var(--success)'][s] ?? 'var(--border)',
  }
}

// ─── Styles partagés ──────────────────────────────────────────────────────────

const input: React.CSSProperties = {
  width: '100%', height: 40, padding: '0 12px',
  backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, outline: 'none',
  transition: 'border-color 150ms ease', fontFamily: 'var(--font-body)',
}

const label: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)',
  textTransform: 'uppercase', letterSpacing: '0.07em',
}

const field = (children: React.ReactNode) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
)

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ ...input, ...props.style }}
      onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
      onBlur={e  => { e.currentTarget.style.borderColor = 'var(--border)' }}
    />
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{
        ...input, height: 80, padding: '10px 12px',
        resize: 'vertical', lineHeight: 1.5, ...props.style,
      }}
      onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
      onBlur={e  => { e.currentTarget.style.borderColor = 'var(--border)' }}
    />
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter()

  // Infos personnelles
  const [firstname, setFirstname] = useState('')
  const [lastname,  setLastname]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPwd,   setShowPwd]   = useState(false)

  // Infos garage
  const [garageName,  setGarageName]  = useState('')
  const [garageCity,  setGarageCity]  = useState('')
  const [garageAddr,  setGarageAddr]  = useState('')
  const [garagePhone, setGaragePhone] = useState('')
  const [garageEmail, setGarageEmail] = useState('')
  const [garageDesc,  setGarageDesc]  = useState('')

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const strength = passwordStrength(password)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (!garageName.trim() || !garageCity.trim()) {
      setError('Le nom et la ville du garage sont obligatoires.')
      return
    }

    setLoading(true)
    try {
      const body = {
        firstname, lastname, email, password,
        role: 'GARAGISTE' as const,
        garage: {
          name:        garageName.trim(),
          city:        garageCity.trim(),
          address:     garageAddr.trim()  || undefined,
          phone:       garagePhone.trim() || undefined,
          email:       garageEmail.trim() || undefined,
          description: garageDesc.trim()  || undefined,
        },
      }

      const res = await fetch(`${API}/api/v1/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { code?: string; message?: string }
        setError(ERROR_MAP[data.code ?? ''] ?? data.message ?? 'Une erreur est survenue.')
        return
      }

      router.push(`/confirm?email=${encodeURIComponent(email)}`)
    } catch {
      setError('Impossible de contacter le serveur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ width: '100%', maxWidth: 600 }}>
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '36px 32px' }}>

          {/* En-tête */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 6, backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}>
                <Wrench size={13} strokeWidth={2} />
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Espace garagiste
              </span>
            </div>
            <h1 className="font-display" style={{ fontSize: 26, fontStyle: 'italic', fontWeight: 400, color: 'var(--text-primary)', letterSpacing: '-0.015em', lineHeight: 1.2, marginBottom: 6 }}>
              Créer mon compte garage
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Inscrivez votre atelier sur MyKpokpo et commencez à recevoir des rendez-vous en ligne.
            </p>
          </div>

          {/* Bandeau d'erreur */}
          {error && (
            <div style={{ padding: '10px 12px', borderRadius: 8, marginBottom: 20, backgroundColor: 'var(--danger-muted)', border: '1px solid rgba(184,48,53,0.22)', fontSize: 13, color: 'var(--danger)', lineHeight: 1.5 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* ── Infos personnelles ── */}
            <p style={label}>Informations personnelles</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {field(<>
                <label htmlFor="firstname" style={label}>Prénom</label>
                <Input id="firstname" type="text" value={firstname} onChange={e => setFirstname(e.target.value)}
                  placeholder="Kofi" required autoComplete="given-name" />
              </>)}
              {field(<>
                <label htmlFor="lastname" style={label}>Nom</label>
                <Input id="lastname" type="text" value={lastname} onChange={e => setLastname(e.target.value)}
                  placeholder="Mensah" required autoComplete="family-name" />
              </>)}
            </div>

            {field(<>
              <label htmlFor="email" style={label}>Email</label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="kofi@mongarage.com" required autoComplete="email" />
            </>)}

            {field(<>
              <label htmlFor="password" style={label}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <Input id="password" type={showPwd ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="8 caractères minimum" required autoComplete="new-password"
                  style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? 'Masquer' : 'Afficher'}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                  {showPwd ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
                </button>
              </div>
              {password && (
                <div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[0,1,2,3].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i < strength.score ? strength.color : 'var(--border)', transition: 'background-color 200ms ease' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: strength.color, fontWeight: 500 }}>{strength.label}</span>
                </div>
              )}
            </>)}

            {/* ── Infos du garage ── */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4 }}>
              <p style={{ ...label, marginBottom: 14 }}>Informations du garage</p>

              {field(<>
                <label htmlFor="garageName" style={label}>Nom du garage <span style={{ color: 'var(--danger)' }}>*</span></label>
                <Input id="garageName" type="text" value={garageName} onChange={e => setGarageName(e.target.value)}
                  placeholder="Garage Auto-Élite" required />
              </>)}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
                {field(<>
                  <label htmlFor="garageCity" style={label}>Ville <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <Input id="garageCity" type="text" value={garageCity} onChange={e => setGarageCity(e.target.value)}
                    placeholder="Lomé" required />
                </>)}
                {field(<>
                  <label htmlFor="garagePhone" style={label}>Téléphone</label>
                  <Input id="garagePhone" type="tel" value={garagePhone} onChange={e => setGaragePhone(e.target.value)}
                    placeholder="+228 90 00 00 00" autoComplete="tel" />
                </>)}
              </div>

              <div style={{ marginTop: 14 }}>
                {field(<>
                  <label htmlFor="garageAddr" style={label}>Adresse</label>
                  <Input id="garageAddr" type="text" value={garageAddr} onChange={e => setGarageAddr(e.target.value)}
                    placeholder="Rue des Palmiers, Tokoin" />
                </>)}
              </div>

              <div style={{ marginTop: 14 }}>
                {field(<>
                  <label htmlFor="garageEmail" style={label}>Email du garage</label>
                  <Input id="garageEmail" type="email" value={garageEmail} onChange={e => setGarageEmail(e.target.value)}
                    placeholder="contact@mongarage.com" autoComplete="off" />
                </>)}
              </div>

              <div style={{ marginTop: 14 }}>
                {field(<>
                  <label htmlFor="garageDesc" style={label}>Description</label>
                  <Textarea id="garageDesc" value={garageDesc} onChange={e => setGarageDesc(e.target.value)}
                    placeholder="Spécialiste en mécanique générale, climatisation…" />
                </>)}
              </div>
            </div>

            {/* ── Bouton soumettre ── */}
            <button
              type="submit"
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 42, marginTop: 8, borderRadius: 8, border: 'none', backgroundColor: 'var(--accent)', color: '#FFF', fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'opacity 150ms ease', fontFamily: 'var(--font-body)' }}
            >
              {loading
                ? <><Loader2 size={15} strokeWidth={2} style={{ animation: 'spin 0.8s linear infinite' }} /> Création du compte…</>
                : 'Créer mon compte'}
            </button>

            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
              En créant un compte, vous acceptez nos{' '}
              <a href="/cgu" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Conditions d&apos;utilisation</a>
              {' '}et notre{' '}
              <a href="/confidentialite" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Politique de confidentialité</a>.
            </p>
          </form>
        </div>

        {/* ── Encart particuliers → mobile ────────────────────────────── */}
        <div style={{ marginTop: 16, padding: '16px 20px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 9, backgroundColor: 'var(--accent-muted)', color: 'var(--accent)', flexShrink: 0 }}>
            <Smartphone size={17} strokeWidth={1.75} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 2 }}>
              Vous êtes un particulier&nbsp;?
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Téléchargez l&apos;application mobile <strong>MyKpokpo</strong> pour gérer vos véhicules et prendre rendez-vous.
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
          Déjà un compte&nbsp;?{' '}
          <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            Se connecter
          </Link>
        </p>
      </div>
    </>
  )
}
