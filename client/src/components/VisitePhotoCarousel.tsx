import { useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import { resolvePhotoUrl } from '../api/client.ts'
import CoverPhoto from './CoverPhoto.tsx'

interface VisitePhotoCarouselProps {
  photos: string[]
  alt: string
}

const MAX_THUMBS = 4
// En-deçà de ce déplacement horizontal (px), un touch est traité comme un
// tap plutôt qu'un swipe (évite de changer de photo sur un simple appui qui
// tremble légèrement).
const SWIPE_THRESHOLD = 40

/**
 * Carrousel photo inline (pas de lightbox plein écran) pour une carte de
 * visite : photo principale + navigation précédent/suivant en overlay, et
 * une bande de vignettes cliquables sous la photo (plafonnée à 4, avec une
 * tuile `+N` pour la 5e photo et au-delà — voir commentaire plus bas).
 */
function VisitePhotoCarousel({ photos, alt }: VisitePhotoCarouselProps) {
  const [index, setIndex] = useState(0)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  if (photos.length === 0) {
    return (
      <div className="visite-carousel visite-carousel--empty">
        <CoverPhoto alt={alt} />
      </div>
    )
  }

  const resolved = photos.map(resolvePhotoUrl)
  // Filet de sécurité si `photos` change de taille entre deux rendus (ex.
  // suppression d'une photo) et que `index` pointe désormais hors bornes.
  const currentIndex = Math.min(index, resolved.length - 1)

  function showPrevious() {
    setIndex((i) => (i - 1 + resolved.length) % resolved.length)
  }

  function showNext() {
    setIndex((i) => (i + 1) % resolved.length)
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  // Swipe tactile (mobile) : le clavier/bouton précédent-suivant reste la
  // voie desktop, ce handler est un no-op sans événement tactile.
  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = touchStartRef.current
    touchStartRef.current = null
    if (!start) {
      return
    }
    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y
    if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) < Math.abs(deltaY)) {
      return
    }
    if (deltaX < 0) {
      showNext()
    } else {
      showPrevious()
    }
  }

  const visibleThumbs = resolved.slice(0, MAX_THUMBS)
  const overflowCount = resolved.length - MAX_THUMBS

  return (
    <div className="visite-carousel">
      <div
        className="visite-carousel-main"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img src={resolved[currentIndex]} alt={alt} loading="lazy" />

        {resolved.length > 1 && (
          <>
            <button
              type="button"
              className="visite-carousel-nav visite-carousel-nav--prev"
              aria-label="Photo précédente"
              onClick={showPrevious}
            >
              ‹
            </button>
            <button
              type="button"
              className="visite-carousel-nav visite-carousel-nav--next"
              aria-label="Photo suivante"
              onClick={showNext}
            >
              ›
            </button>
            <div className="visite-carousel-dots" role="tablist" aria-label="Photo affichée">
              {resolved.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  className={
                    i === currentIndex
                      ? 'visite-carousel-dot visite-carousel-dot--active'
                      : 'visite-carousel-dot'
                  }
                  aria-label={`Aller à la photo ${i + 1}`}
                  aria-selected={i === currentIndex}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {resolved.length > 1 && (
        <div className="visite-carousel-thumbs">
          {visibleThumbs.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              className={
                i === currentIndex
                  ? 'visite-carousel-thumb visite-carousel-thumb--active'
                  : 'visite-carousel-thumb'
              }
              aria-label={`Voir la photo ${i + 1}`}
              aria-current={i === currentIndex}
              onClick={() => setIndex(i)}
            >
              <img src={url} alt="" loading="lazy" />
            </button>
          ))}
          {overflowCount > 0 && (
            <button
              type="button"
              className="visite-carousel-thumb visite-carousel-thumb--overflow"
              aria-label={`Voir ${overflowCount} photo${overflowCount > 1 ? 's' : ''} de plus`}
              onClick={() => setIndex(MAX_THUMBS)}
            >
              +{overflowCount}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default VisitePhotoCarousel
