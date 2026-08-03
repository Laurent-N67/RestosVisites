const PALETTE = [
  '#ff7a45', // accent
  '#22c55e', // success
  '#3b82f6',
  '#a855f7',
  '#f5a623', // star
  '#14b8a6',
  '#ec4899',
  '#6366f1',
  '#84cc16',
] as const

interface AvatarProps {
  name: string
  size?: number
}

/**
 * Hash de chaîne simple (djb2-like) pour dériver un index de palette
 * déterministe à partir du nom affiché — le même utilisateur a toujours la
 * même couleur, sans dépendance externe (pas de service d'avatars).
 */
function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function initialsFromName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) {
    return '?'
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }
  return (words[0][0] + words[1][0]).toUpperCase()
}

/**
 * Avatar auto-généré (initiales + couleur déterministe) pour l'annuaire des
 * utilisateurs — pas de champ avatar côté backend, purement dérivé du nom
 * affiché côté client.
 */
function Avatar({ name, size = 40 }: AvatarProps) {
  const color = PALETTE[hashString(name) % PALETTE.length]
  const initials = initialsFromName(name)

  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        background: color,
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}

export default Avatar
