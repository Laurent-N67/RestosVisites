export interface AddressSuggestion {
  id: string
  label: string
  nom: string
  adresse: string
  latitude: number
  longitude: number
}

interface PhotonProperties {
  name?: string
  street?: string
  housenumber?: string
  postcode?: string
  city?: string
  state?: string
  country?: string
}

interface PhotonFeature {
  properties: PhotonProperties
  geometry: {
    coordinates: [number, number]
  }
}

interface PhotonResponse {
  features: PhotonFeature[]
}

function composeAddress(props: PhotonProperties): string {
  const parts: string[] = []

  const street = [props.housenumber, props.street].filter(Boolean).join(' ')
  if (street) {
    parts.push(street)
  }

  const locality = [props.postcode, props.city].filter(Boolean).join(' ')
  if (locality) {
    parts.push(locality)
  }

  if (props.country) {
    parts.push(props.country)
  }

  return parts.join(', ')
}

export async function searchAddress(
  query: string,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) {
    return []
  }

  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=5`
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`La recherche d'adresse a échoué (${response.status}).`)
  }

  const data = (await response.json()) as PhotonResponse

  return data.features
    .filter((feature) => feature.geometry?.coordinates?.length === 2)
    .map((feature, index) => {
      const props = feature.properties
      const [longitude, latitude] = feature.geometry.coordinates
      const adresse = composeAddress(props)
      const nom = props.name ?? adresse ?? 'Lieu sans nom'
      const label = props.name && adresse ? `${props.name} — ${adresse}` : nom

      return {
        id: `${latitude}-${longitude}-${index}`,
        label,
        nom,
        adresse: adresse || nom,
        latitude,
        longitude,
      }
    })
}
