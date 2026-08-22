import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import CustomSelect from './CustomSelect.tsx'
import { StarIcon } from './icons/Icons.tsx'

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
]

describe('CustomSelect', () => {
  it('affiche le libellé et la valeur courante, fermé par défaut', () => {
    render(
      <CustomSelect icon={StarIcon} label="Filtre" value="a" options={options} onChange={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: 'Filtre Option A' })).toBeInTheDocument()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it("sélectionne une option, appelle onChange et se ferme", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <CustomSelect icon={StarIcon} label="Filtre" value="a" options={options} onChange={onChange} />,
    )

    await user.click(screen.getByRole('button', { name: 'Filtre Option A' }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.click(screen.getByRole('option', { name: 'Option B' }))

    expect(onChange).toHaveBeenCalledWith('b')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('se ferme avec Échap', async () => {
    const user = userEvent.setup()
    render(
      <CustomSelect icon={StarIcon} label="Filtre" value="a" options={options} onChange={vi.fn()} />,
    )

    await user.click(screen.getByRole('button', { name: 'Filtre Option A' }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('se ferme au clic extérieur', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <CustomSelect icon={StarIcon} label="Filtre" value="a" options={options} onChange={vi.fn()} />
        <button type="button">Ailleurs</button>
      </div>,
    )

    await user.click(screen.getByRole('button', { name: 'Filtre Option A' }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ailleurs' }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
