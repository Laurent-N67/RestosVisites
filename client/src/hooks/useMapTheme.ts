import { useEffect, useState } from 'react'

export type MapTheme = 'light' | 'dark'

const STORAGE_KEY = 'restosvisites:map-theme'

function readStoredTheme(): MapTheme | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
}

function getInitialTheme(): MapTheme {
  const stored = readStoredTheme()
  if (stored) {
    return stored
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/**
 * Thème (clair/sombre) des tuiles de la carte, persisté dans localStorage
 * pour se souvenir du choix entre sessions. À défaut de préférence
 * enregistrée, se base sur la préférence système de l'appareil.
 */
export function useMapTheme() {
  const [theme, setTheme] = useState<MapTheme>(getInitialTheme)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Stockage indisponible (navigation privée, quota...) : le choix ne
      // persistera pas, mais l'app reste fonctionnelle.
    }
  }, [theme])

  function toggleTheme() {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'))
  }

  return { theme, toggleTheme }
}
