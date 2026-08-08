const GROUP_COLOR_KEYS: Record<string, string> = {
  'Gamme de prix': 'prix',
  'Type de cuisine': 'cuisine',
  "Style d'établissement": 'style',
  'Autres caractéristiques': 'autres',
}

export function groupColorKey(groupe: string): string {
  return GROUP_COLOR_KEYS[groupe] ?? 'default'
}
