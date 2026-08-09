import { Link, useLocation } from 'react-router-dom'
import { ChecklistIcon, HeartIcon, HomeIcon } from './icons/Icons.tsx'

const BOTTOM_NAV_ITEMS = [
  { to: '/', label: 'Accueil', icon: HomeIcon, match: (path: string) => path === '/' },
  {
    to: '/liste',
    label: 'Restaurants',
    icon: ChecklistIcon,
    match: (path: string) => path === '/liste',
  },
  {
    to: '/favoris',
    label: 'Favoris',
    icon: HeartIcon,
    match: (path: string) => path.startsWith('/favoris'),
  },
] as const

/**
 * Navigation basse mobile-only (≤900px, cf. App.css) : 3 raccourcis
 * seulement (Accueil/Carte, Restaurants, Favoris) — remplace `.app-nav` sur
 * mobile, qui reste cependant inchangé et utilisé tel quel sur desktop.
 * Volontairement sans "Utilisateurs" (reste accessible via UserMenu) ni
 * "Visites" (rattachées à chaque restaurant, pas d'onglet dédié). Rendue une
 * seule fois globalement par `App.tsx`, uniquement quand un utilisateur est
 * connecté.
 */
function BottomNav() {
  const location = useLocation()

  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
      {BOTTOM_NAV_ITEMS.map(({ to, label, icon: Icon, match }) => {
        const active = match(location.pathname)
        return (
          <Link
            key={to}
            to={to}
            className={active ? 'bottom-nav-item bottom-nav-item--active' : 'bottom-nav-item'}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export default BottomNav
