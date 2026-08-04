export interface SessionPosition {
  latitude: number
  longitude: number
}

const GEOLOCATION_TIMEOUT_MS = 5000

// Mise en cache au niveau du module : on ne demande la géolocalisation
// qu'une seule fois par session, quel que soit le nombre d'appelants
// (recherche d'adresse, recommandations…).
let cachedPositionPromise: Promise<SessionPosition | undefined> | null = null

/**
 * Position de l'utilisateur, mise en cache pour toute la session : le
 * navigateur ne demande la permission de géolocalisation qu'une seule fois,
 * quel que soit le nombre de composants/hooks qui l'utilisent. Se résout en
 * `undefined` (sans erreur) en cas de refus, d'indisponibilité ou de timeout.
 */
export function getSessionPosition(): Promise<SessionPosition | undefined> {
  if (!cachedPositionPromise) {
    cachedPositionPromise = new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        resolve(undefined)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        () => {
          // Permission refusée, indisponible, timeout… on se contente
          // de continuer sans position, sans afficher d'erreur.
          resolve(undefined)
        },
        { timeout: GEOLOCATION_TIMEOUT_MS },
      )
    })
  }

  return cachedPositionPromise
}
