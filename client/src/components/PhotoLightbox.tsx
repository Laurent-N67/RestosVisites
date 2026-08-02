import { useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import { createPortal } from 'react-dom'

interface PhotoLightboxProps {
  photos: string[]
  startIndex: number
  onClose: () => void
}

function PhotoLightbox({ photos, startIndex, onClose }: PhotoLightboxProps) {
  const [index, setIndex] = useState(startIndex)

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
    </div>,
    document.body,
  )
}

export default PhotoLightbox
