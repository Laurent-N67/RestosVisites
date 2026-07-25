// Le bundling par défaut de Leaflet référence ses icônes via des chemins
// relatifs qui ne survivent pas au bundling Vite. On les réimporte en tant
// qu'assets et on les réassigne à l'icône par défaut.
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

type IconDefaultPrototype = typeof L.Icon.Default.prototype & {
  _getIconUrl?: unknown
}

delete (L.Icon.Default.prototype as IconDefaultPrototype)._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})
