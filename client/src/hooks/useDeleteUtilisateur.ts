import { useState } from 'react'
import { supprimerUtilisateur } from '../api/client.ts'
import type { UtilisateurAvecFavoris } from '../api/types.ts'
import { errorMessage } from '../utils/errors.ts'

/**
 * Logique de suppression d'un compte utilisateur par un admin (confirmation,
 * appel Api, état de chargement/erreur), même forme que
 * `useDeleteRestaurant`.
 */
export function useDeleteUtilisateur(
  onDeleted: (utilisateur: UtilisateurAvecFavoris) => void,
) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(utilisateur: UtilisateurAvecFavoris) {
    if (
      !window.confirm(
        `Supprimer le compte de "${utilisateur.nomAffiche}" et toutes ses visites ?`,
      )
    ) {
      return
    }

    setDeleting(true)
    setError(null)
    try {
      await supprimerUtilisateur(utilisateur.id)
      onDeleted(utilisateur)
    } catch (err) {
      setError(errorMessage(err, "La suppression de l'utilisateur a échoué."))
      setDeleting(false)
    }
  }

  return { deleting, error, handleDelete }
}
