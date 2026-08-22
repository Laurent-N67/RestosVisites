/**
 * Convertit un `Date` en chaîne ISO `yyyy-mm-dd` à partir de ses composants
 * locaux plutôt que via `toISOString()` (basé sur UTC, qui peut faire
 * basculer sur le jour précédent/suivant selon le fuseau de l'utilisateur).
 */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDate(isoDate: string): string {
  const parsed = isoDate.includes('T') ? new Date(isoDate) : new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return isoDate
  }
  return parsed.toLocaleDateString('fr-FR')
}

export function stars(note: number): string {
  const filled = Math.max(0, Math.min(5, note))
  return '★'.repeat(filled) + '☆'.repeat(5 - filled)
}

export function formatNoteMoyenne(note: number): string {
  return note.toFixed(1)
}

export function formatDistanceKm(distanceKm: number): string {
  return `${distanceKm.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`
}

/**
 * Extrait la ville d'une adresse au format Nominatim/OpenStreetMap
 * ("<rue>, <code postal> <ville>, <pays>") : l'avant-dernier segment
 * séparé par des virgules, débarrassé de son éventuel code postal en tête
 * ("67200 Strasbourg" → "Strasbourg"). Repli sur l'adresse complète si elle
 * ne contient pas au moins 2 segments (format inattendu).
 */
export function villeFromAdresse(adresse: string): string {
  const segments = adresse
    .split(',')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
  if (segments.length < 2) {
    return adresse.trim()
  }
  const avantDernier = segments[segments.length - 2]
  return avantDernier.replace(/^[\d-]+\s+/, '')
}
