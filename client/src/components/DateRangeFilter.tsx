import { useEffect, useRef, useState } from 'react'
import { CalendarIcon } from './icons/Icons.tsx'

export interface DateRange {
  start: Date | null
  end: Date | null
}

interface DateRangeFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
// Nombre de mois affichés dans la feuille mobile, en défilement vertical :
// 12 mois en arrière (couvre l'essentiel d'un historique de visites) + le
// mois courant + 1 mois à venir, plutôt qu'une liste infinie virtualisée qui
// serait disproportionnée pour ce filtre.
const MOBILE_MONTHS_BEFORE = 12
const MOBILE_MONTHS_AFTER = 1

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1)
}

function isSameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) {
    return false
  }
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isBetween(day: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) {
    return false
  }
  return day.getTime() > start.getTime() && day.getTime() < end.getTime()
}

function formatShort(date: Date): string {
  return date.toLocaleDateString('fr-FR')
}

function formatMonthLabel(date: Date): string {
  const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatRangeLabel(range: DateRange): string {
  if (range.start && range.end) {
    return `${formatShort(range.start)} → ${formatShort(range.end)}`
  }
  if (range.start) {
    return `Depuis le ${formatShort(range.start)}`
  }
  if (range.end) {
    return `Jusqu'au ${formatShort(range.end)}`
  }
  return 'Toutes les dates'
}

/** Grille des jours d'un mois, avec cases vides en tête pour aligner le 1er
 * du mois sur sa colonne de jour de semaine (semaine commençant le lundi). */
function buildMonthDays(month: Date): (Date | null)[] {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  // `getDay()` renvoie 0 pour dimanche ; on décale pour que 0 = lundi.
  const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7
  const days: (Date | null)[] = Array.from({ length: firstWeekday }, () => null)
  for (let d = 1; d <= daysInMonth; d += 1) {
    days.push(new Date(year, monthIndex, d))
  }
  return days
}

interface MonthGridProps {
  month: Date
  range: DateRange
  anchor: Date | null
  onSelectDay: (day: Date) => void
}

function MonthGrid({ month, range, anchor, onSelectDay }: MonthGridProps) {
  const today = new Date()
  const rangeStart = anchor ?? range.start
  const rangeEnd = anchor ? null : range.end

  return (
    <div className="date-range-month">
      <p className="date-range-month-label">{formatMonthLabel(month)}</p>
      <div className="date-range-weekdays" aria-hidden="true">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
      <div className="date-range-days">
        {buildMonthDays(month).map((day, i) => {
          if (!day) {
            return <span key={`blank-${i}`} className="date-range-day date-range-day--blank" />
          }
          const isStart = isSameDay(day, rangeStart)
          const isEnd = isSameDay(day, rangeEnd)
          const inRange = isBetween(day, rangeStart, rangeEnd)
          const isToday = isSameDay(day, today)
          const classes = ['date-range-day']
          if (isStart || isEnd) {
            classes.push('date-range-day--edge')
          }
          if (inRange) {
            classes.push('date-range-day--in-range')
          }
          if (isToday) {
            classes.push('date-range-day--today')
          }
          return (
            <button
              key={day.toISOString()}
              type="button"
              className={classes.join(' ')}
              aria-pressed={isStart || isEnd}
              aria-label={formatShort(day)}
              onClick={() => onSelectDay(day)}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Filtre "période de visite" : un seul champ affichant la plage choisie
 * (ou "Toutes les dates"), qui ouvre soit un popover 2 mois (desktop, >900px)
 * soit une feuille plein écran avec mois empilés défilants (mobile,
 * ≤900px) — les deux sont montés simultanément dès que `open`, et c'est le
 * CSS (media queries, cf. App.css) qui décide laquelle est visible, comme le
 * reste des adaptations responsive du projet. La sélection se fait en 2
 * clics (ancre puis borne) : sur desktop, le 2e clic ferme aussitôt le
 * popover ; sur mobile, la feuille reste ouverte jusqu'au bouton "Appliquer"
 * pour laisser le temps de vérifier la plage en surbrillance.
 */
function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<Date | null>(null)
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()))
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
        setAnchor(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev
      if (next) {
        setVisibleMonth(startOfMonth(value.start ?? new Date()))
        setAnchor(null)
      }
      return next
    })
  }

  function handleClear() {
    setAnchor(null)
    onChange({ start: null, end: null })
  }

  function handleSelectDay(day: Date, closeOnComplete: boolean) {
    if (!anchor) {
      setAnchor(day)
      onChange({ start: day, end: null })
      return
    }
    const start = day.getTime() < anchor.getTime() ? day : anchor
    const end = day.getTime() < anchor.getTime() ? anchor : day
    onChange({ start, end })
    setAnchor(null)
    if (closeOnComplete) {
      setOpen(false)
    }
  }

  const mobileMonths = Array.from(
    { length: MOBILE_MONTHS_BEFORE + MOBILE_MONTHS_AFTER + 1 },
    (_, i) => addMonths(startOfMonth(new Date()), i - MOBILE_MONTHS_BEFORE),
  )

  return (
    <div className="date-range-filter" ref={containerRef}>
      <button
        type="button"
        className={
          value.start || value.end
            ? 'date-range-trigger date-range-trigger--active'
            : 'date-range-trigger'
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={toggleOpen}
      >
        <CalendarIcon aria-hidden="true" />
        <span>{formatRangeLabel(value)}</span>
      </button>

      {open && (
        <>
          {/* Desktop (>900px) : popover 2 mois, cf. .date-range-popover en CSS */}
          <div className="date-range-popover" role="dialog" aria-label="Choisir une période">
            <div className="date-range-popover-nav">
              <button
                type="button"
                className="date-range-nav-btn"
                aria-label="Mois précédent"
                onClick={() => setVisibleMonth((m) => addMonths(m, -1))}
              >
                ‹
              </button>
              {anchor && (
                <p className="date-range-popover-hint">Choisissez la date de fin</p>
              )}
              <button
                type="button"
                className="date-range-nav-btn"
                aria-label="Mois suivant"
                onClick={() => setVisibleMonth((m) => addMonths(m, 1))}
              >
                ›
              </button>
            </div>
            <div className="date-range-popover-months">
              <MonthGrid
                month={visibleMonth}
                range={value}
                anchor={anchor}
                onSelectDay={(day) => handleSelectDay(day, true)}
              />
              <MonthGrid
                month={addMonths(visibleMonth, 1)}
                range={value}
                anchor={anchor}
                onSelectDay={(day) => handleSelectDay(day, true)}
              />
            </div>
            <div className="date-range-popover-footer">
              <button type="button" className="date-range-clear" onClick={handleClear}>
                Effacer
              </button>
            </div>
          </div>

          {/* Mobile (≤900px) : feuille plein écran, cf. .date-range-sheet en CSS
              — pas de fond cliquable derrière : la feuille couvre déjà tout
              l'écran, la fermeture passe par le bouton × ou "Appliquer". */}
          <div className="date-range-sheet" role="dialog" aria-label="Choisir une période">
            <div className="date-range-sheet-header">
              <p>Période de visite</p>
              <button
                type="button"
                className="date-range-sheet-close"
                aria-label="Fermer"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            {anchor && (
              <p className="date-range-popover-hint">Choisissez la date de fin</p>
            )}
            <div className="date-range-sheet-months">
              {mobileMonths.map((month) => (
                <MonthGrid
                  key={month.toISOString()}
                  month={month}
                  range={value}
                  anchor={anchor}
                  onSelectDay={(day) => handleSelectDay(day, false)}
                />
              ))}
            </div>
            <div className="date-range-sheet-footer">
              <button type="button" className="date-range-clear" onClick={handleClear}>
                Effacer
              </button>
              <button
                type="button"
                className="date-range-apply"
                onClick={() => {
                  setAnchor(null)
                  setOpen(false)
                }}
              >
                Appliquer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default DateRangeFilter
