import { useEffect, useRef, useState } from 'react'
import type { ComponentType, SVGProps } from 'react'
import { ChevronDownIcon } from './icons/Icons.tsx'

export interface CustomSelectOption<T extends string | number> {
  value: T
  label: string
}

interface CustomSelectProps<T extends string | number> {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  value: T
  options: CustomSelectOption<T>[]
  onChange: (value: T) => void
  /** Variante de gabarit (`list-sort-label--note`, etc.), pour réutiliser
   * telles quelles les règles CSS existantes (masquage mobile, mise en
   * avant desktop) qui ciblent ces classes. */
  triggerClassName?: string
}

/**
 * Remplace un `<select>` natif par un déclencheur pilule + un menu flottant
 * custom (même gabarit visuel `.list-sort-label` que l'ancien select, donc
 * aucun changement de layout dans la barre de filtres). Ferme au clic
 * extérieur, à la sélection d'une option, ou à Échap — même pattern que
 * `CategoryFilterDropdown.tsx`/`VisiteActionsMenu` ailleurs dans le projet.
 */
function CustomSelect<T extends string | number>({
  icon: Icon,
  label,
  value,
  options,
  onChange,
  triggerClassName,
}: CustomSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number; minWidth: number }>()
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // `position: fixed` ancré via `getBoundingClientRect()` plutôt que
  // `position: absolute` relatif au conteneur : ce filtre vit dans
  // `.list-controls-filters`, dont l'`overflow-x` (bande de chips
  // défilante sur mobile) force `overflow-y` à `auto` par la même occasion
  // (règle du spec CSS overflow) — un panneau `absolute` y serait
  // silencieusement coupé au lieu de s'afficher sous le déclencheur.
  function handleToggle() {
    setOpen((prev) => {
      const next = !prev
      if (next && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        setPanelStyle({ top: rect.bottom + 6, left: rect.left, minWidth: rect.width })
      }
      return next
    })
  }

  useEffect(() => {
    if (!open) {
      return
    }
    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const current = options.find((option) => option.value === value)
  const triggerClasses = ['list-sort-label', triggerClassName].filter(Boolean).join(' ')

  return (
    <div className="custom-select" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className={triggerClasses}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={handleToggle}
      >
        <Icon className="list-sort-icon" aria-hidden="true" />
        {label} <span className="custom-select-value">{current?.label ?? ''}</span>
        <ChevronDownIcon className="list-sort-chevron" aria-hidden="true" />
      </button>

      {open && panelStyle && (
        <ul
          className="custom-select-panel"
          role="listbox"
          aria-label={label}
          style={panelStyle}
        >
          {options.map((option) => {
            const active = option.value === value
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={
                    active
                      ? 'custom-select-option custom-select-option--active'
                      : 'custom-select-option'
                  }
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default CustomSelect
