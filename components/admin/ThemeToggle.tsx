'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  /*
   * next-themes résout le thème uniquement côté client.
   * Sans ce guard, le composant se rend en SSR avec `theme === undefined`,
   * ce qui provoquerait un mismatch d'hydratation sur l'icône affichée.
   */
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const isDark   = theme === 'dark'
  const nextTheme = isDark ? 'light' : 'dark'
  const label     = isDark ? 'Passer en mode clair' : 'Passer en mode sombre'

  return (
    <button
      onClick={() => setTheme(nextTheme)}
      title={label}
      aria-label={label}
      style={{
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        width:           34,
        height:          34,
        borderRadius:    8,
        border:          'none',
        backgroundColor: 'transparent',
        color:           'var(--text-secondary)',
        cursor:          'pointer',
        transition:      'background-color 150ms ease, color 150ms ease',
        flexShrink:      0,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.backgroundColor = 'var(--bg-elevated)'
        el.style.color           = 'var(--text-primary)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.backgroundColor = 'transparent'
        el.style.color           = 'var(--text-secondary)'
      }}
    >
      {/*
       * On n'affiche rien avant le montage (évite le flash icône incorrecte).
       * La hauteur fixe du bouton (34px) évite tout layout shift.
       */}
      {mounted && (
        isDark
          ? <Sun  size={16} strokeWidth={1.75} aria-hidden="true" />
          : <Moon size={16} strokeWidth={1.75} aria-hidden="true" />
      )}
    </button>
  )
}
