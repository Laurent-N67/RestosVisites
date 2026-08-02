import { describe, expect, it } from 'vitest'
import { ApiError } from '../api/client.ts'
import { errorMessage } from './errors.ts'

describe('errorMessage', () => {
  it("renvoie le detail de l'ApiError quand il est présent", () => {
    const err = new ApiError(400, 'Bad Request', 'Le nom est requis.')
    expect(errorMessage(err, 'fallback')).toBe('Le nom est requis.')
  })

  it("retombe sur le message de l'ApiError si detail est absent", () => {
    const err = new ApiError(500, 'Erreur serveur')
    expect(errorMessage(err, 'fallback')).toBe('Erreur serveur')
  })

  it("utilise le fallback pour une erreur qui n'est pas une ApiError", () => {
    expect(errorMessage(new Error('boom'), 'fallback')).toBe('fallback')
    expect(errorMessage('boom', 'fallback')).toBe('fallback')
    expect(errorMessage(undefined, 'fallback')).toBe('fallback')
  })
})
