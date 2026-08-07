import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Restaurant } from '../api/types.ts'

interface RestaurantSearchProps {
  restaurants: Restaurant[]
}

const MAX_RESULTS = 6

function RestaurantSearch({ restaurants }: RestaurantSearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const trimmed = query.trim().toLowerCase()
  const results =
    trimmed.length === 0
      ? []
      : restaurants
          .filter(
            (restaurant) =>
              restaurant.nom.toLowerCase().includes(trimmed) ||
              restaurant.adresse.toLowerCase().includes(trimmed),
          )
          .slice(0, MAX_RESULTS)

  function selectRestaurant(restaurantId: string) {
    setQuery('')
    setOpen(false)
    navigate(`/restaurants/${restaurantId}`)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setOpen(false)
      event.currentTarget.blur()
    } else if (event.key === 'Enter' && results.length > 0) {
      selectRestaurant(results[0].id)
    }
  }

  function handleBlur() {
    // Laisse le temps au clic sur un résultat de se déclencher avant de
    // fermer la liste (sinon le onClick n'a jamais lieu, le blur ferme
    // d'abord la liste et démonte le bouton cliqué).
    window.setTimeout(() => setOpen(false), 150)
  }

  return (
    <div className="restaurant-search" ref={containerRef}>
      <input
        type="search"
        className="restaurant-search-input"
        placeholder="Rechercher un restaurant…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        aria-label="Rechercher un restaurant"
      />
      {open && trimmed.length > 0 && (
        <ul className="restaurant-search-results">
          {results.length === 0 ? (
            <li className="restaurant-search-empty">Aucun restaurant trouvé.</li>
          ) : (
            results.map((restaurant) => (
              <li key={restaurant.id}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectRestaurant(restaurant.id)}
                >
                  <span className="restaurant-search-name">{restaurant.nom}</span>
                  <span className="restaurant-search-adresse">{restaurant.adresse}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

export default RestaurantSearch
