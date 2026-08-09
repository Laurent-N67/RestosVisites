import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Utilisateur } from '../api/types.ts'
import type { Theme } from '../hooks/useTheme.ts'
import Avatar from './Avatar.tsx'
import { ChevronDownIcon } from './icons/Icons.tsx'

interface UserMenuProps {
  user: Utilisateur
  theme: Theme
  onSetTheme: (theme: Theme) => void
  onLogout: () => void
}

function UserMenu({ user, theme, onSetTheme, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="user-menu" ref={containerRef}>
      <button
        type="button"
        className="user-menu-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar name={user.nomAffiche} size={32} />
        <span className="user-menu-name">{user.nomAffiche}</span>
        <ChevronDownIcon
          className={open ? 'user-menu-chevron user-menu-chevron--open' : 'user-menu-chevron'}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="user-menu-dropdown" role="menu">
          <Link to="/profil" role="menuitem" onClick={() => setOpen(false)}>
            Profil
          </Link>
          {/* "Utilisateurs" n'est pas dans la navigation basse mobile (cf.
              BottomNav.tsx) : reste accessible ici, mais seulement sur
              mobile (`.user-menu-mobile-only`, cf. App.css) — sur desktop,
              déjà présent dans `.app-nav`, pas besoin de le dupliquer ici. */}
          <Link
            to="/utilisateurs"
            role="menuitem"
            className="user-menu-mobile-only"
            onClick={() => setOpen(false)}
          >
            Utilisateurs
          </Link>
          {/* Bascule de thème : masquée sur desktop (déjà dans l'en-tête),
              repliée ici sur mobile où l'en-tête n'a plus la place pour elle
              (cf. header ≤900px, App.css). */}
          <div
            className="user-menu-theme user-menu-mobile-only"
            role="group"
            aria-label="Thème"
          >
            <button
              type="button"
              className={theme === 'light' ? 'active' : ''}
              onClick={() => onSetTheme('light')}
            >
              ☀️ Clair
            </button>
            <button
              type="button"
              className={theme === 'dark' ? 'active' : ''}
              onClick={() => onSetTheme('dark')}
            >
              🌙 Sombre
            </button>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
          >
            Déconnexion
          </button>
        </div>
      )}
    </div>
  )
}

export default UserMenu
