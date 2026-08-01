import { useState } from 'react'
import { deleteRestaurant } from '../api/client.ts'
import type { Restaurant } from '../api/types.ts'
import { errorMessage } from '../utils/errors.ts'

/**
 * Logique de suppression d'un restaurant (confirmation, appel Api, état de
 * chargement/erreur), partagée entre la carte et la vue liste.
 */
export function useDeleteRestaurant(onDeleted: () => void) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(restaurant: Restaurant) {
    if (
      !window.confirm(
        `Supprimer "${restaurant.nom}" et toutes ses visites ?`,
      )
    ) {
      return
    }

    setDeleting(true)
    setError(null)
    try {
      await deleteRestaurant(restaurant.id)
      onDeleted()
    } catch (err) {
      setError(errorMessage(err, 'La suppression du restaurant a échoué.'))
      setDeleting(false)
    }
  }

  return { deleting, error, handleDelete }
}
