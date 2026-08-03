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

/** Formate une taille en octets en une chaîne lisible (Ko, Mo, Go…), à la française. */
export function formatOctets(octets: number): string {
  if (octets < 1000) {
    return `${octets} o`
  }
  const unites = ['Ko', 'Mo', 'Go', 'To']
  let valeur = octets
  let uniteIndex = -1
  do {
    valeur /= 1000
    uniteIndex += 1
  } while (valeur >= 1000 && uniteIndex < unites.length - 1)
  return `${valeur.toFixed(1).replace('.', ',')} ${unites[uniteIndex]}`
}
