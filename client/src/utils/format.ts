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
