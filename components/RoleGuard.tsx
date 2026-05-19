'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { fetchMe, type UserProfile } from '@/lib/api'
import { Loader2 } from 'lucide-react'

const ROLE_HOME: Record<UserProfile['role'], string> = {
  ADMIN:     '/dashboard',
  GARAGISTE: '/garage/dashboard',
  CLIENT:    '/login',
}

interface RoleGuardProps {
  allow:    UserProfile['role']
  children: React.ReactNode
}

/**
 * Vérifie que l'utilisateur connecté a le rôle requis pour la zone courante.
 *
 * Comportement :
 *   - Pas de token        → redirige vers /login (avec ?redirect=…)
 *   - Token invalide / 401 → redirige vers /login
 *   - Rôle ≠ allow         → redirige vers la home du bon rôle
 *   - CLIENT sur web       → renvoyé au /login (compte mobile-only)
 *   - Rôle == allow        → rend `children`
 *
 * Affiche un spinner plein écran pendant la vérification (évite le flash de
 * contenu protégé). À placer dans les layouts (admin) et (garagiste).
 */
export default function RoleGuard({ allow, children }: RoleGuardProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function check() {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      if (!token) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
        return
      }

      try {
        const me = await fetchMe()
        if (cancelled) return

        if (me.role === 'CLIENT') {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          document.cookie = 'auth_session=; path=/; max-age=0; SameSite=Strict'
          router.replace('/login')
          return
        }

        if (me.role !== allow) {
          router.replace(ROLE_HOME[me.role] ?? '/login')
          return
        }

        setReady(true)
      } catch {
        if (cancelled) return
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        document.cookie = 'auth_session=; path=/; max-age=0; SameSite=Strict'
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
      }
    }

    check()
    return () => { cancelled = true }
  }, [allow, pathname, router])

  if (!ready) {
    return (
      <div
        style={{
          position:       'fixed',
          inset:          0,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-base)',
          color:          'var(--text-muted)',
          zIndex:         100,
        }}
      >
        <Loader2 size={22} strokeWidth={1.75} style={{ animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return <>{children}</>
}
