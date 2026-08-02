import { describe, expect, it } from 'vitest'
import { validerMotDePasse } from './motDePasse.ts'

describe('validerMotDePasse', () => {
  it("ne renvoie aucune violation pour un mot de passe conforme", () => {
    expect(validerMotDePasse('Sup3rMotDePasse!')).toEqual([])
  })

  it('signale une longueur insuffisante', () => {
    expect(validerMotDePasse('Ab1!')).toContain('Au moins 12 caractères.')
  })

  it("signale l'absence de majuscule", () => {
    const violations = validerMotDePasse('minuscules123!')
    expect(violations).toContain('Au moins une majuscule.')
  })

  it("signale l'absence de chiffre", () => {
    const violations = validerMotDePasse('AucunChiffreIci!')
    expect(violations).toContain('Au moins un chiffre.')
  })

  it("signale l'absence de caractère spécial", () => {
    const violations = validerMotDePasse('AucunCaractereSpecial123')
    expect(violations).toContain('Au moins un caractère spécial.')
  })

  it('cumule toutes les violations pour une chaîne vide', () => {
    expect(validerMotDePasse('')).toEqual([
      'Au moins 12 caractères.',
      'Au moins une majuscule.',
      'Au moins un chiffre.',
      'Au moins un caractère spécial.',
    ])
  })
})
