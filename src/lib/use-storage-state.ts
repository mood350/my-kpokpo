import { useCallback, useEffect, useReducer } from 'react'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

type UseStateHook<T> = [[boolean, T | null], (value: T | null) => void]

function useAsyncState<T>(initialValue: [boolean, T | null] = [true, null]): UseStateHook<T> {
  return useReducer(
    (_state: [boolean, T | null], action: T | null = null): [boolean, T | null] => [false, action],
    initialValue
  ) as UseStateHook<T>
}

export async function setStorageItemAsync(key: string, value: string | null) {
  if (Platform.OS === 'web') {
    try {
      if (value === null) localStorage.removeItem(key)
      else                localStorage.setItem(key, value)
    } catch {
      // localStorage may be unavailable (private mode, SSR)
    }
    return
  }

  if (value === null) await SecureStore.deleteItemAsync(key)
  else                await SecureStore.setItemAsync(key, value)
}

/**
 * Persisted state hook.
 *   - native : expo-secure-store (Keychain / Keystore)
 *   - web    : localStorage
 *
 * Returns `[[isLoading, value], setValue]`. Loading is true until the first
 * read resolves; `value` is `null` when no entry exists.
 */
export function useStorageState(key: string): UseStateHook<string> {
  const [state, setState] = useAsyncState<string>()

  useEffect(() => {
    let cancelled = false

    if (Platform.OS === 'web') {
      try {
        const v = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
        if (!cancelled) setState(v)
      } catch {
        if (!cancelled) setState(null)
      }
    } else {
      SecureStore.getItemAsync(key).then(v => {
        if (!cancelled) setState(v)
      })
    }

    return () => { cancelled = true }
  }, [key])

  const setValue = useCallback(
    (value: string | null) => {
      setState(value)
      setStorageItemAsync(key, value)
    },
    [key]
  )

  return [state, setValue]
}
