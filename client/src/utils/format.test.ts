import { describe, expect, it } from 'vitest'
import { formatDate, formatOctets, stars } from './format.ts'

describe('formatDate', () => {
  it('formate une date ISO au format fr-FR', () => {
    expect(formatDate('2026-08-02')).toBe('02/08/2026')
  })

  it('renvoie la chaîne originale si la date est invalide', () => {
    expect(formatDate('pas-une-date')).toBe('pas-une-date')
  })

  it('formate une date-heure ISO complète (DateTimeOffset)', () => {
    expect(formatDate('2026-08-02T15:08:20.182806+00:00')).toBe('02/08/2026')
  })
})

describe('stars', () => {
  it('affiche des étoiles pleines suivies d\'étoiles vides', () => {
    expect(stars(3)).toBe('★★★☆☆')
  })

  it('plafonne à 5 étoiles pleines', () => {
    expect(stars(7)).toBe('★★★★★')
  })

  it('plafonne à 0 étoile pleine pour une note négative', () => {
    expect(stars(-2)).toBe('☆☆☆☆☆')
  })

  it('gère la note maximale et minimale exactes', () => {
    expect(stars(5)).toBe('★★★★★')
    expect(stars(0)).toBe('☆☆☆☆☆')
  })
})

describe('formatOctets', () => {
  it('affiche les octets tels quels sous 1000', () => {
    expect(formatOctets(512)).toBe('512 o')
  })

  it('formate en Mo au-delà du seuil', () => {
    expect(formatOctets(45_300_000)).toBe('45,3 Mo')
  })

  it('formate en Ko pour les tailles intermédiaires', () => {
    expect(formatOctets(3_100_000)).toBe('3,1 Mo')
    expect(formatOctets(1_500)).toBe('1,5 Ko')
  })
})
