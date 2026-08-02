import { useState } from 'react'
import { deleteVisite } from '../api/client.ts'
import type { Visite } from '../api/types.ts'
import { errorMessage } from '../utils/errors.ts'

/**
 * Logique de suppression d'une visite (confirmation, appel Api, état de
 * chargement/erreur), partagée entre la popup carte et la page détail d'un
 * restaurant.
 */
export function useDeleteVisite(onDeleted: (restaurantId: string) => void) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(visite: Visite) {
    if (!window.confirm('Supprimer cette visite ?')) {
      return
    }

    setDeletingId(visite.id)
    setError(null)
    try {
      await deleteVisite(visite.id)
      onDeleted(visite.restaurantId)
    } catch (err) {
      setError(errorMessage(err, 'La suppression de la visite a échoué.'))
    } finally {
      setDeletingId(null)
    }
  }

  return { deletingId, error, handleDelete }
}
