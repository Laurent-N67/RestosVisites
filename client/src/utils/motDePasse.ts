const LONGUEUR_MINIMALE = 12

/**
 * Retour d'un feedback UX live sur la politique de mot de passe côté
 * inscription (le serveur reste la source de vérité, un 422 peut toujours
 * survenir). Liste des règles violées, vide si le mot de passe est valide.
 */
export function validerMotDePasse(motDePasse: string): string[] {
  const violations: string[] = []

  if (motDePasse.length < LONGUEUR_MINIMALE) {
    violations.push(`Au moins ${LONGUEUR_MINIMALE} caractères.`)
  }
  if (!/[A-Z]/.test(motDePasse)) {
    violations.push('Au moins une majuscule.')
  }
  if (!/[0-9]/.test(motDePasse)) {
    violations.push('Au moins un chiffre.')
  }
  if (!/[^A-Za-z0-9]/.test(motDePasse)) {
    violations.push('Au moins un caractère spécial.')
  }

  return violations
}
