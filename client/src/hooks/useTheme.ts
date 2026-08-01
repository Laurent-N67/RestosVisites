import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'restosvisites:theme'

function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
}

function getInitialTheme(): Theme {
  const stored = readStoredTheme()
  if (stored) {
    return stored
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/**
 * Thème global (clair/sombre) de l'application, persisté dans localStorage
 * pour se souvenir du choix entre sessions. À défaut de préférence
 * enregistrée, se base sur la préférence système de l'appareil. Applique le
 * thème sur `<html data-theme="...">` pour que les variables CSS globales
 * (App.css / index.css) et le chrome Leaflet en tiennent compte.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
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

  return { theme, setTheme, toggleTheme }
}
