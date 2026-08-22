import { useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { formatDate, stars } from '../utils/format.ts'
import Avatar from './Avatar.tsx'

export interface LightboxCaption {
  author: string
  date: string
  note: number
}

interface PhotoLightboxProps {
  photos: string[]
  startIndex: number
  onClose: () => void
  /**
   * Légende par photo (auteur/date/note), même longueur et même ordre que
   * `photos` — `null`/absent pour une photo sans attribution (ex. photo du
   * restaurant plutôt que d'une visite). Optionnel : les appelants existants
   * (carrousel de visite) n'en passent pas et gardent leur rendu inchangé.
   */
  captions?: (LightboxCaption | null)[]
}

function PhotoLightbox({ photos, startIndex, onClose, captions }: PhotoLightboxProps) {
  const [index, setIndex] = useState(startIndex)
  const caption = captions?.[index]

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowRight') {
        setIndex((i) => (i + 1) % photos.length)
      } else if (event.key === 'ArrowLeft') {
        setIndex((i) => (i - 1 + photos.length) % photos.length)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, photos.length])

  function showPrevious(event: MouseEvent) {
    event.stopPropagation()
    setIndex((i) => (i - 1 + photos.length) % photos.length)
  }

  function showNext(event: MouseEvent) {
    event.stopPropagation()
    setIndex((i) => (i + 1) % photos.length)
  }

  return createPortal(
    <div className="lightbox-overlay" onClick={onClose}>
      <button
        type="button"
        className="lightbox-close"
        aria-label="Fermer"
        onClick={onClose}
      >
        ×
      </button>

      {photos.length > 1 && (
        <button
          type="button"
          className="lightbox-nav lightbox-nav--prev"
          aria-label="Photo précédente"
          onClick={showPrevious}
        >
          ‹
        </button>
      )}

      <img
        src={photos[index]}
        alt=""
        className="lightbox-image"
        onClick={(event) => event.stopPropagation()}
      />

      {photos.length > 1 && (
        <button
          type="button"
          className="lightbox-nav lightbox-nav--next"
          aria-label="Photo suivante"
          onClick={showNext}
        >
          ›
        </button>
      )}

      {photos.length > 1 && (
        <span className="lightbox-counter">
          {index + 1} / {photos.length}
        </span>
      )}

      {caption && (
        <div className="lightbox-caption" onClick={(event) => event.stopPropagation()}>
          <Avatar name={caption.author} size={32} />
          <div>
            <p className="lightbox-caption-auteur">{caption.author}</p>
            <p className="lightbox-caption-meta">
              {formatDate(caption.date)} ·{' '}
              <span aria-label={`Note ${caption.note} sur 5`}>{stars(caption.note)}</span>
            </p>
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}

export default PhotoLightbox
