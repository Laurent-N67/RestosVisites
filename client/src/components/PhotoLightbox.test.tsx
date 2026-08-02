import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import PhotoLightbox from './PhotoLightbox.tsx'

const photos = ['/photo-1.jpg', '/photo-2.jpg', '/photo-3.jpg']

function getImage(): HTMLImageElement {
  return document.querySelector('.lightbox-image') as HTMLImageElement
}

function getOverlay(): HTMLElement {
  return document.querySelector('.lightbox-overlay') as HTMLElement
}

describe('PhotoLightbox', () => {
  it("s'ouvre sur la photo cliquée", () => {
    render(<PhotoLightbox photos={photos} startIndex={1} onClose={vi.fn()} />)

    expect(getImage()).toHaveAttribute('src', '/photo-2.jpg')
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('navigue vers la photo suivante, de façon circulaire', async () => {
    const user = userEvent.setup()
    render(<PhotoLightbox photos={photos} startIndex={2} onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Photo suivante' }))

    expect(getImage()).toHaveAttribute('src', '/photo-1.jpg')
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })

  it('navigue vers la photo précédente, de façon circulaire', async () => {
    const user = userEvent.setup()
    render(<PhotoLightbox photos={photos} startIndex={0} onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Photo précédente' }))

    expect(getImage()).toHaveAttribute('src', '/photo-3.jpg')
    expect(screen.getByText('3 / 3')).toBeInTheDocument()
  })

  it('se ferme sur la touche Echap', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<PhotoLightbox photos={photos} startIndex={0} onClose={onClose} />)

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('se ferme au clic sur le fond', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<PhotoLightbox photos={photos} startIndex={0} onClose={onClose} />)

    await user.click(getOverlay())

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("ne se ferme pas au clic sur l'image elle-même", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<PhotoLightbox photos={photos} startIndex={0} onClose={onClose} />)

    await user.click(getImage())

    expect(onClose).not.toHaveBeenCalled()
  })

  it("n'affiche pas les flèches de navigation ni le compteur pour une seule photo", () => {
    render(
      <PhotoLightbox photos={['/photo-1.jpg']} startIndex={0} onClose={vi.fn()} />,
    )

    expect(
      screen.queryByRole('button', { name: 'Photo suivante' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Photo précédente' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('1 / 1')).not.toBeInTheDocument()
  })
})
