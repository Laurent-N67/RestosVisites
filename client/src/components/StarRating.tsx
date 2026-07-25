import { useState } from 'react'

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  max?: number
}

function StarRating({ value, onChange, max = 5 }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const displayValue = hovered ?? value

  return (
    <div
      className="star-rating"
      role="radiogroup"
      aria-label="Note"
      onMouseLeave={() => setHovered(null)}
    >
      {Array.from({ length: max }, (_, index) => index + 1).map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
          className={`star${star <= displayValue ? ' star--filled' : ''}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default StarRating
