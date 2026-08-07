import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Utilisateur } from '../api/types.ts'
import Avatar from './Avatar.tsx'
import { ChevronDownIcon } from './icons/Icons.tsx'

interface UserMenuProps {
  user: Utilisateur
  onLogout: () => void
}

function UserMenu({ user, onLogout }: UserMenuProps) {
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
