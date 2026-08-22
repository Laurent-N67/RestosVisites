import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import DateRangeFilter from './DateRangeFilter.tsx'
import type { DateRange } from './DateRangeFilter.tsx'

// Jours du mois courant (10 et 20 existent dans tous les mois, contrairement
// à 30/31) : évite de dépendre d'une date système précise tout en restant
// déterministe.
function currentMonthDay(day: number): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), day)
}

function label(date: Date): string {
  return date.toLocaleDateString('fr-FR')
}

function Wrapper() {
  const [range, setRange] = useState<DateRange>({ start: null, end: null })
  return <DateRangeFilter value={range} onChange={setRange} />
}

describe('DateRangeFilter', () => {
  it('affiche "Toutes les dates" par défaut', () => {
    render(<Wrapper />)
    expect(screen.getByText('Toutes les dates')).toBeInTheDocument()
  })

  it('sélectionne une plage en 2 clics et met à jour le déclencheur', async () => {
    const user = userEvent.setup()
    render(<Wrapper />)

    await user.click(screen.getByRole('button', { name: 'Toutes les dates' }))

    const start = currentMonthDay(10)
    const end = currentMonthDay(20)

    // Le popover desktop et la feuille mobile sont montés en même temps
    // (bascule via CSS) : on cible la première occurrence, celle du popover.
    const [startDay] = screen.getAllByLabelText(label(start))
    await user.click(startDay)
    const [endDay] = screen.getAllByLabelText(label(end))
    await user.click(endDay)

    expect(
      screen.getByText(`${label(start)} → ${label(end)}`),
    ).toBeInTheDocument()
  })

  it('"Effacer" réinitialise la plage', async () => {
    const user = userEvent.setup()
    render(<Wrapper />)

    await user.click(screen.getByRole('button', { name: 'Toutes les dates' }))
    const [startDay] = screen.getAllByLabelText(label(currentMonthDay(10)))
    await user.click(startDay)

    const [clearButton] = screen.getAllByRole('button', { name: 'Effacer' })
    await user.click(clearButton)

    expect(screen.getByText('Toutes les dates')).toBeInTheDocument()
  })
})
