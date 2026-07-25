interface ChipsProps {
  items: string[]
  onRemove: (index: number) => void
  emptyLabel?: string
}

function Chips({ items, onRemove, emptyLabel }: ChipsProps) {
  if (items.length === 0) {
    return emptyLabel ? <p className="chips-empty">{emptyLabel}</p> : null
  }

  return (
    <ul className="chips">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="chip">
          <span className="chip-label">{item}</span>
          <button
            type="button"
            className="chip-remove"
            aria-label={`Retirer ${item}`}
            onClick={() => onRemove(index)}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  )
}

export default Chips
