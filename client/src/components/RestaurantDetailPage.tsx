import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { resolvePhotoUrl } from '../api/client.ts'
import type { Restaurant, UtilisateurAvecFavoris, Visite } from '../api/types.ts'
import { Role } from '../api/types.ts'
import { useAuth } from '../contexts/AuthContext.tsx'
import { useDeleteRestaurant } from '../hooks/useDeleteRestaurant.ts'
import { useDeleteVisite } from '../hooks/useDeleteVisite.ts'
import { useFavoriToggle } from '../hooks/useFavoriToggle.ts'
import { formatDate, formatNoteMoyenne, stars } from '../utils/format.ts'
import {
  averageNote,
  estFavoriDeUtilisateur,
  favorisCountForRestaurant,
} from '../utils/visites.ts'
import Avatar from './Avatar.tsx'
import CategoryBadges from './CategoryBadges.tsx'
import CoverPhoto from './CoverPhoto.tsx'
import { HeartIcon, PinIcon } from './icons/Icons.tsx'
import type { LightboxCaption } from './PhotoLightbox.tsx'
import PhotoLightbox from './PhotoLightbox.tsx'

interface RestaurantDetailPageProps {
  restaurants: Restaurant[]
  visites: Visite[]
  utilisateursAvecFavoris: UtilisateurAvecFavoris[]
  onEditRestaurant: (restaurant: Restaurant) => void
  onEditVisite: (visite: Visite) => void
  onRestaurantDeleted: () => void
  onVisiteDeleted: () => void
  onAddVisite: (restaurantId: string) => void
}

interface LightboxState {
  photos: string[]
  captions: (LightboxCaption | null)[]
  index: number
}

interface GalleryPhoto {
  url: string
  author: string | null
  date: string | null
  note: number | null
}

const VISITS_PAGE_SIZE = 5

/**
 * Fusionne les photos du restaurant et celles de toutes les visites en une
 * seule galerie (dédupliquée par URL) : photos du restaurant d'abord, puis
 * celles des visites (déjà triées plus récentes d'abord par l'appelant).
 */
function buildGalleryPhotos(restaurant: Restaurant, restaurantVisites: Visite[]): GalleryPhoto[] {
  const seen = new Set<string>()
  const photos: GalleryPhoto[] = []
  for (const photo of restaurant.photos) {
    if (seen.has(photo.url)) {
      continue
    }
    seen.add(photo.url)
    photos.push({ url: photo.url, author: null, date: null, note: null })
  }
  for (const visite of restaurantVisites) {
    for (const url of visite.urlsPhotos) {
      if (seen.has(url)) {
        continue
      }
      seen.add(url)
      photos.push({
        url,
        author: visite.utilisateurNomAffiche,
        date: visite.date,
        note: visite.note,
      })
    }
  }
  return photos
}

interface CommunityVisiteCardProps {
  visite: Visite
  isFavoriDeAuteur: boolean
  canManage: boolean
  deleting: boolean
  onEdit: () => void
  onDelete: () => void
  onOpenPhoto: (index: number) => void
}

function CommunityVisiteCard({
  visite,
  isFavoriDeAuteur,
  canManage,
  deleting,
  onEdit,
  onDelete,
  onOpenPhoto,
}: CommunityVisiteCardProps) {
  return (
    <article className="community-visite-card">
      <div className="community-visite-header">
        <Avatar name={visite.utilisateurNomAffiche} size={40} />
        <div className="community-visite-identity">
          <p className="community-visite-auteur">
            {visite.utilisateurNomAffiche}
            {isFavoriDeAuteur && <span className="popup-favori-badge">★ Restaurant favori !</span>}
          </p>
          <p className="community-visite-date">{formatDate(visite.date)}</p>
        </div>
        <span className="popup-stars community-visite-stars" aria-label={`Note ${visite.note} sur 5`}>
          {stars(visite.note)}
        </span>
      </div>

      {visite.commentaire && (
        <p className="popup-visite-commentaire community-visite-commentaire">{visite.commentaire}</p>
      )}

      {visite.urlsPhotos.length > 0 && (
        <div className="community-visite-photos">
          {visite.urlsPhotos.map((url, index) => (
            <button
              key={url}
              type="button"
              className="detail-photo-thumb"
              onClick={() => onOpenPhoto(index)}
            >
              <img src={resolvePhotoUrl(url)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {canManage && (
        <div className="popup-visite-actions">
          <button type="button" className="popup-btn" onClick={onEdit}>
            Modifier
          </button>
          <button
            type="button"
            className="popup-btn popup-btn-danger"
            disabled={deleting}
            onClick={onDelete}
          >
            {deleting ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      )}
    </article>
  )
}

function RestaurantDetailPage({
  restaurants,
  visites,
  utilisateursAvecFavoris,
  onEditRestaurant,
  onEditVisite,
  onRestaurantDeleted,
  onVisiteDeleted,
  onAddVisite,
}: RestaurantDetailPageProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [lightbox, setLightbox] = useState<LightboxState | null>(null)
  const [visibleVisitsCount, setVisibleVisitsCount] = useState(VISITS_PAGE_SIZE)
  const { user } = useAuth()
  const isAdmin = user?.role === Role.Admin

  function handleBack() {
    if (location.key !== 'default') {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  const restaurant = restaurants.find((r) => r.id === id) ?? null

  const {
    deleting: deletingRestaurant,
    error: restaurantError,
    handleDelete: handleDeleteRestaurant,
  } = useDeleteRestaurant(() => {
    onRestaurantDeleted()
    navigate('/')
  })

  const {
    deletingId: deletingVisiteId,
    error: visiteError,
    handleDelete: handleDeleteVisite,
  } = useDeleteVisite(onVisiteDeleted)

  const {
    isFavori,
    loading: favoriLoading,
    pending: favoriPending,
    error: favoriError,
    toggle: toggleFavori,
  } = useFavoriToggle(id ?? '')

  const restaurantVisites = useMemo(
    () =>
      restaurant
        ? visites
            .filter((visite) => visite.restaurantId === restaurant.id)
            .sort((a, b) => b.date.localeCompare(a.date))
        : [],
    [visites, restaurant],
  )

  const galleryPhotos = useMemo(
    () => (restaurant ? buildGalleryPhotos(restaurant, restaurantVisites) : []),
    [restaurant, restaurantVisites],
  )

  if (!restaurant) {
    return (
      <div className="detail-page">
        <p className="popup-status popup-error">Restaurant introuvable.</p>
        <button type="button" className="detail-back-link" onClick={handleBack}>
          ← Retour
        </button>
      </div>
    )
  }

  const restaurantAverageNote = averageNote(restaurantVisites)
  const uniqueVisitorsCount = new Set(restaurantVisites.map((v) => v.utilisateurId)).size
  const favorisCount = favorisCountForRestaurant(utilisateursAvecFavoris, restaurant.id)
  const photoPrincipale =
    restaurant.photos.find((photo) => photo.estPrincipale) ?? restaurant.photos[0]
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`
  const visibleVisites = restaurantVisites.slice(0, visibleVisitsCount)

  function openVisitePhoto(visite: Visite, index: number) {
    setLightbox({
      photos: visite.urlsPhotos.map(resolvePhotoUrl),
      captions: visite.urlsPhotos.map(() => ({
        author: visite.utilisateurNomAffiche,
        date: visite.date,
        note: visite.note,
      })),
      index,
    })
  }

  function openGalleryPhoto(index: number) {
    setLightbox({
      photos: galleryPhotos.map((photo) => resolvePhotoUrl(photo.url)),
      captions: galleryPhotos.map((photo) =>
        photo.author && photo.date && photo.note !== null
          ? { author: photo.author, date: photo.date, note: photo.note }
          : null,
      ),
      index,
    })
  }

  return (
    <div className="detail-page restaurant-detail-page">
      <button type="button" className="detail-back-link" onClick={handleBack}>
        ← Retour
      </button>

      <div className="restaurant-hero">
        <CoverPhoto url={photoPrincipale?.url} alt={restaurant.nom} />
        <div className="restaurant-hero-overlay" aria-hidden="true" />
        <div className="restaurant-hero-content">
          <h1 className="restaurant-hero-title">{restaurant.nom}</h1>
          <div className="restaurant-hero-actions">
            <button
              type="button"
              className={
                isFavori
                  ? 'restaurant-hero-favori restaurant-hero-favori--active'
                  : 'restaurant-hero-favori'
              }
              disabled={favoriLoading || favoriPending}
              aria-label={isFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              onClick={() => void toggleFavori()}
            >
              <HeartIcon fill={isFavori ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              className="restaurant-hero-add-visite"
              onClick={() => onAddVisite(restaurant.id)}
            >
              + Ajouter une visite
            </button>
          </div>
        </div>
      </div>

      {favoriError && <p className="popup-status popup-error">{favoriError}</p>}

      <div className="restaurant-info-card card">
        {isAdmin && (
          <div className="restaurant-info-admin-actions">
            <button type="button" className="popup-btn" onClick={() => onEditRestaurant(restaurant)}>
              Modifier
            </button>
            <button
              type="button"
              className="popup-btn popup-btn-danger"
              disabled={deletingRestaurant}
              onClick={() => void handleDeleteRestaurant(restaurant)}
            >
              {deletingRestaurant ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        )}
        {restaurantError && <p className="popup-status popup-error">{restaurantError}</p>}

        <div className="restaurant-info-stats">
          {restaurantVisites.length > 0 && restaurantAverageNote !== null ? (
            <div className="restaurant-info-rating">
              <span
                className="popup-stars"
                aria-label={`Note moyenne ${formatNoteMoyenne(restaurantAverageNote)} sur 5`}
              >
                {stars(Math.round(restaurantAverageNote))}
              </span>
              <span className="restaurant-info-rating-value">
                {formatNoteMoyenne(restaurantAverageNote)}
              </span>
            </div>
          ) : (
            <p className="popup-status">Aucune visite enregistrée.</p>
          )}

          <div className="restaurant-info-stat-grid">
            <div className="restaurant-info-stat">
              <strong>{restaurantVisites.length}</strong>
              <span>visite{restaurantVisites.length > 1 ? 's' : ''}</span>
            </div>
            <div className="restaurant-info-stat">
              <strong>{uniqueVisitorsCount}</strong>
              <span>visiteur{uniqueVisitorsCount > 1 ? 's' : ''}</span>
            </div>
            <div className="restaurant-info-stat">
              <strong>{galleryPhotos.length}</strong>
              <span>photo{galleryPhotos.length > 1 ? 's' : ''}</span>
            </div>
            <div className="restaurant-info-stat">
              <strong>{favorisCount}</strong>
              <span>favori{favorisCount > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        <p className="restaurant-info-adresse">
          <PinIcon aria-hidden="true" />
          {restaurant.adresse}
        </p>

        {restaurant.categories.length > 0 && (
          <CategoryBadges categories={restaurant.categories} max={restaurant.categories.length} />
        )}

        {(restaurant.telephone || restaurant.siteWeb || restaurant.horaires) && (
          <dl className="restaurant-contact-info">
            {restaurant.telephone && (
              <div className="restaurant-contact-row">
                <dt>Téléphone</dt>
                <dd>
                  <a href={`tel:${restaurant.telephone}`}>{restaurant.telephone}</a>
                </dd>
              </div>
            )}
            {restaurant.siteWeb && (
              <div className="restaurant-contact-row">
                <dt>Site web</dt>
                <dd>
                  <a href={restaurant.siteWeb} target="_blank" rel="noopener noreferrer">
                    {restaurant.siteWeb}
                  </a>
                </dd>
              </div>
            )}
            {restaurant.horaires && (
              <div className="restaurant-contact-row">
                <dt>Horaires</dt>
                <dd>{restaurant.horaires}</dd>
              </div>
            )}
          </dl>
        )}

        <a className="popup-directions" href={directionsUrl} target="_blank" rel="noopener noreferrer">
          Itinéraire
        </a>
      </div>

      <div className="restaurant-description-card card">
        <h2>Description</h2>
        {restaurant.description ? (
          <p className="restaurant-detail-description">{restaurant.description}</p>
        ) : (
          <p className="restaurant-description-empty">
            Aucune description pour ce restaurant pour le moment.
          </p>
        )}
      </div>

      <div className="restaurant-detail-columns">
        <section className="restaurant-visites-column">
          <h2 className="detail-visites-title">Historique des visites</h2>
          {visiteError && <p className="popup-status popup-error">{visiteError}</p>}

          {restaurantVisites.length === 0 ? (
            <p className="popup-status">Aucune visite enregistrée.</p>
          ) : (
            <>
              <div className="community-visites-list">
                {visibleVisites.map((visite) => (
                  <CommunityVisiteCard
                    key={visite.id}
                    visite={visite}
                    isFavoriDeAuteur={estFavoriDeUtilisateur(
                      utilisateursAvecFavoris,
                      visite.utilisateurId,
                      restaurant.id,
                    )}
                    canManage={isAdmin || user?.id === visite.utilisateurId}
                    deleting={deletingVisiteId === visite.id}
                    onEdit={() => onEditVisite(visite)}
                    onDelete={() => void handleDeleteVisite(visite)}
                    onOpenPhoto={(index) => openVisitePhoto(visite, index)}
                  />
                ))}
              </div>
              {visibleVisitsCount < restaurantVisites.length && (
                <button
                  type="button"
                  className="restaurant-visites-voir-plus"
                  onClick={() => setVisibleVisitsCount((count) => count + VISITS_PAGE_SIZE)}
                >
                  Voir plus de visites
                </button>
              )}
            </>
          )}
        </section>

        <section className="restaurant-gallery-column">
          <h2 className="detail-visites-title">Galerie photo</h2>
          {galleryPhotos.length === 0 ? (
            <p className="restaurant-description-empty">Aucune photo pour le moment.</p>
          ) : (
            <div className="restaurant-gallery-grid">
              {galleryPhotos.map((photo, index) => (
                <button
                  key={photo.url}
                  type="button"
                  className="restaurant-gallery-item"
                  onClick={() => openGalleryPhoto(index)}
                >
                  <img src={resolvePhotoUrl(photo.url)} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {lightbox && (
        <PhotoLightbox
          photos={lightbox.photos}
          captions={lightbox.captions}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}

export default RestaurantDetailPage
