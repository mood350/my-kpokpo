import { createContext, use, useEffect, useCallback, type PropsWithChildren } from 'react'

import { useStorageState } from './use-storage-state'
import { registerForPushAsync, unregisterPushAsync } from './push-notifications'
import {
  login as apiLogin,
  fetchMe,
  setAccessToken,
  ApiError,
  type UserProfile,
  type AuthTokens,
} from './api'

interface SessionContextValue {
  signIn:  (email: string, password: string) => Promise<void>
  signOut: () => void
  session: string | null   // access token
  isLoading: boolean
}

const AuthContext = createContext<SessionContextValue | null>(null)

export function useSession(): SessionContextValue {
  const value = use(AuthContext)
  if (!value) throw new Error('useSession must be used inside <SessionProvider />')
  return value
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState('access_token')

  // Keep the api client in sync with the stored token so every request
  // automatically carries the Authorization header.
  useEffect(() => {
    setAccessToken(session)
  }, [session])

  // Au démarrage avec une session valide (cold start après login précédent),
  // on (re-)enregistre le push token. Best-effort : ignore les erreurs.
  useEffect(() => {
    if (!session) return
    registerForPushAsync().catch(() => null)
  }, [session])

  const signIn = useCallback(async (email: string, password: string) => {
    const tokens: AuthTokens = await apiLogin({ email, password })
    setAccessToken(tokens.access_token)

    // Refuse non-CLIENT logins on mobile.
    let me: UserProfile
    try {
      me = await fetchMe()
    } catch (e) {
      setAccessToken(null)
      throw e
    }

    if (me.role !== 'CLIENT') {
      setAccessToken(null)
      throw new ApiError(
        403,
        "Cette application est réservée aux particuliers. Utilisez la console web pour vous connecter.",
        'WRONG_ROLE',
      )
    }

    setSession(tokens.access_token)
    // Best-effort, ne bloque pas la navigation post-login.
    registerForPushAsync().catch(() => null)
  }, [setSession])

  const signOut = useCallback(() => {
    // On efface d'abord le token Expo côté backend, PUIS on coupe la session locale.
    // Sinon l'appel HTTP partirait sans Authorization header.
    unregisterPushAsync().finally(() => {
      setAccessToken(null)
      setSession(null)
    })
  }, [setSession])

  return (
    <AuthContext value={{ signIn, signOut, session, isLoading }}>
      {children}
    </AuthContext>
  )
}
