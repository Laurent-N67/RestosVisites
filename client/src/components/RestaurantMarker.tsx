import { useState } from 'react'
import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { resolvePhotoUrl } from '../api/client.ts'
import type { Restaurant, UtilisateurAvecFavoris, Visite } from '../api/types.ts'
import { formatDate, formatNoteMoyenne, stars } from '../utils/format.ts'
import { estFavoriDeUtilisateur } from '../utils/visites.ts'
import PhotoLightbox from './PhotoLightbox.tsx'
import type { NoteSummary } from './RestaurantsMap.tsx'

// Icône agrandie (~1.5×) et de couleur distincte (jeton --accent) pour les
// restaurants recommandés, construite en CSS pur (pas de nouvel asset image)
// — l'icône par défaut (leaflet-icon-fix.ts) reste utilisée pour tous les
// autres marqueurs. Partagée entre toutes les instances de marqueurs mis en
// avant : pas besoin de la recréer à chaque rendu.
const RECOMMENDED_ICON = L.divIcon({
  className: 'recommended-marker',
  html: '<span class="recommended-marker-pin"></span>',
  iconSize: [38, 58],
  iconAnchor: [19, 58],
  popupAnchor: [0, -54],
  tooltipAnchor: [22, -46],
})

// Icône par défaut explicite (plutôt que de laisser `icon` à `undefined` sur
// les marqueurs non mis en avant) : react-leaflet fusionne les props dans les
// options du Marker, et une prop `icon` explicitement à `undefined` écrase le
// fallback interne de Leaflet (`Marker.prototype.options.icon`) au lieu de le
// laisser s'appliquer — ce qui fait planter `_initIcon` (`Cannot read
// properties of undefined (reading 'createIcon')`) pour tout marqueur non
// recommandé. Utilise le même `L.Icon.Default` déjà corrigé (URLs d'images)
// par leaflet-icon-fix.ts.
const DEFAULT_ICON = new L.Icon.Default()

interface LightboxState {
  photos: string[]
  index: number
}

export type VisitesState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; visites: Visite[] }

interface RestaurantMarkerProps {
  restaurant: Restaurant
  noteSummary: NoteSummary | null
  onSelect: (restaurantId: string) => void
  onMarkerRef?: (restaurantId: string, instance: L.Marker | null) => void
  /** Restaurant recommandé (style similaire, pas encore visité) : icône agrandie/distincte. */
  highlighted?: boolean
}

interface VisitesSectionProps {
  restaurantId: string
  visitesState: VisitesState
  utilisateursAvecFavoris: UtilisateurAvecFavoris[]
  onEditVisite: (visite: Visite) => void
  onDeleteVisite: (visite: Visite) => void
  deletingVisiteId: string | null
  visiteError: string | null
  currentUserId: string | undefined
  isAdmin: boolean
}

// Exporté : réutilisé tel quel par RestaurantDetailPanel (panneau de détail de
// la vue Carte) pour l'historique des visites, plutôt que de dupliquer ce
// rendu — c'était auparavant uniquement rendu à l'intérieur de la Popup
// Leaflet de ce fichier, désormais supprimée.
export function VisitesSection({
  restaurantId,
  visitesState,
  utilisateursAvecFavoris,
  onEditVisite,
  onDeleteVisite,
  deletingVisiteId,
  visiteError,
  currentUserId,
  isAdmin,
}: VisitesSectionProps) {
  const [lightbox, setLightbox] = useState<LightboxState | null>(null)

  if (visitesState.status === 'idle') {
    return null
  }

  if (visitesState.status === 'loading') {
    return <p className="popup-status">Chargement des visites…</p>
  }

  if (visitesState.status === 'error') {
    return <p className="popup-status popup-error">{visitesState.message}</p>
  }

  const visites = [...visitesState.visites].sort((a, b) =>
    b.date.localeCompare(a.date),
  )

  if (visites.length === 0) {
    return <p className="popup-status">Aucune visite enregistrée.</p>
  }

  return (
    <div className="popup-visites">
      {visiteError && <p className="popup-status popup-error">{visiteError}</p>}
      <ul className="popup-visites-list">
        {visites.map((visite) => (
          <li key={visite.id} className="popup-visite">
            <div className="popup-visite-header">
              <span
                className="popup-stars"
                aria-label={`Note ${visite.note} sur 5`}
              >
                {stars(visite.note)}
              </span>
              <span className="popup-visite-date">{formatDate(visite.date)}</span>
            </div>
            <p className="popup-visite-auteur">
              Visité par {visite.utilisateurNomAffiche}
              {estFavoriDeUtilisateur(
                utilisateursAvecFavoris,
                visite.utilisateurId,
                restaurantId,
              ) && <span className="popup-favori-badge">★ Restaurant favori !</span>}
            </p>

            {visite.commentaire && (
              <p className="popup-visite-commentaire">{visite.commentaire}</p>
            )}

            {visite.urlsPhotos.length > 0 && (
              <div className="popup-photos">
                {visite.urlsPhotos.map((url, index) => (
                  <button
                    key={url}
                    type="button"
                    className="detail-photo-thumb"
                    onClick={() =>
                      setLightbox({
                        photos: visite.urlsPhotos.map(resolvePhotoUrl),
                        index,
                      })
                    }
                  >
                    <img src={resolvePhotoUrl(url)} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            {(isAdmin || currentUserId === visite.utilisateurId) && (
              <div className="popup-visite-actions">
                <button
                  type="button"
                  className="popup-btn"
                  onClick={() => onEditVisite(visite)}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  className="popup-btn popup-btn-danger"
                  disabled={deletingVisiteId === visite.id}
                  onClick={() => onDeleteVisite(visite)}
                >
                  {deletingVisiteId === visite.id ? 'Suppression…' : 'Supprimer'}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {lightbox && (
        <PhotoLightbox
          photos={lightbox.photos}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}

function RestaurantMarker({
  restaurant,
  noteSummary,
  onSelect,
  onMarkerRef,
  highlighted = false,
}: RestaurantMarkerProps) {
  return (
    <Marker
      ref={(instance) => onMarkerRef?.(restaurant.id, instance)}
      position={[restaurant.latitude, restaurant.longitude]}
      icon={highlighted ? RECOMMENDED_ICON : DEFAULT_ICON}
      eventHandlers={{ click: () => onSelect(restaurant.id) }}
    >
      <Tooltip permanent direction="top" offset={[-16, -17]} className="restaurant-label">
        <span className="restaurant-label-nom">{restaurant.nom}</span>
        {noteSummary && (
          <span
            className="restaurant-label-note"
            aria-label={`Note moyenne ${formatNoteMoyenne(noteSummary.average)} sur 5`}
          >
            {formatNoteMoyenne(noteSummary.average)} {stars(Math.round(noteSummary.average))}
          </span>
        )}
      </Tooltip>
    </Marker>
  )
}

export default RestaurantMarker
