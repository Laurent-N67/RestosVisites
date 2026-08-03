using RestosVisites.Application.Abstractions;
using RestosVisites.Application.Exceptions;
using RestosVisites.Domain.Enums;

namespace RestosVisites.Application.UseCases.SupprimerUtilisateur;

/// <summary>
/// Cas d'usage : supprimer un compte utilisateur, que ce soit par un Admin (sur n'importe quel
/// compte) ou par l'utilisateur lui-même (libre-service). Supprime aussi les visites appartenant au
/// compte (leurs photos suivent par cascade en base) ; les favoris suivent également par cascade en
/// base. Empêche la suppression de l'utilisateur historique (LegacyUtilisateurSeed) et celle du
/// dernier administrateur restant.
/// </summary>
public sealed class SupprimerUtilisateur
{
    private readonly IUtilisateurRepository _utilisateurRepository;
    private readonly IVisiteRepository _visiteRepository;

    public SupprimerUtilisateur(IUtilisateurRepository utilisateurRepository, IVisiteRepository visiteRepository)
    {
        _utilisateurRepository = utilisateurRepository;
        _visiteRepository = visiteRepository;
    }

    public async Task ExecuterAsync(SupprimerUtilisateurRequest request, CancellationToken ct = default)
    {
        var utilisateur = await _utilisateurRepository.ObtenirParIdAsync(request.UtilisateurCibleId, ct);
        if (utilisateur is null)
        {
            throw new ErreurApplicationException(
                TypeErreurApplication.RessourceNonTrouvee,
                $"Aucun utilisateur trouvé avec l'identifiant '{request.UtilisateurCibleId}'.");
        }

        if (await _utilisateurRepository.EstUtilisateurHistoriqueAsync(utilisateur.Id, ct))
        {
            throw new ErreurApplicationException(
                TypeErreurApplication.RegleMetierViolee,
                "Le compte historique ne peut pas être supprimé.");
        }

        if (utilisateur.Role == RoleUtilisateur.Admin)
        {
            var nombreAdmins = await _utilisateurRepository.CompterAdminsAsync(ct);
            if (nombreAdmins <= 1)
            {
                throw new ErreurApplicationException(
                    TypeErreurApplication.RegleMetierViolee,
                    "Impossible de supprimer le dernier administrateur restant.");
            }
        }

        await _visiteRepository.SupprimerParUtilisateurAsync(utilisateur.Id, ct);
        await _utilisateurRepository.SupprimerAsync(utilisateur.Id, ct);
    }
}
