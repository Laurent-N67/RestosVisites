import { MapIcon } from './icons/Icons.tsx'

/**
 * État vide de la 3e colonne (panneau détail) de la page Carte, affiché tant
 * qu'aucun restaurant n'est sélectionné — remplace le rendu conditionnel
 * absent d'avant (Phase 7d), qui faisait s'étendre la carte sur 2 colonnes et
 * provoquait un saut de layout dès qu'un restaurant était sélectionné.
 */
function MapDetailEmptyState() {
  return (
    <div className="map-detail-empty">
      <MapIcon aria-hidden="true" />
      <h3>Sélectionnez un restaurant</h3>
      <p>
        Cliquez sur un restaurant dans la liste ou sur la carte pour voir ses
        détails.
      </p>
    </div>
  )
}

export default MapDetailEmptyState
