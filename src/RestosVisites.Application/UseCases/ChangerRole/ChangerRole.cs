using RestosVisites.Application.Abstractions;
using RestosVisites.Application.Exceptions;
using RestosVisites.Domain.Enums;

namespace RestosVisites.Application.UseCases.ChangerRole;

/// <summary>
/// Cas d'usage : changer le rôle d'un utilisateur (promotion/rétrogradation), réservé aux Admins.
/// Empêche de retirer le rôle Admin au dernier administrateur restant, pour ne jamais se retrouver
/// sans compte capable de gérer les rôles.
/// </summary>
public sealed class ChangerRole
{
    private readonly IUtilisateurRepository _utilisateurRepository;

    public ChangerRole(IUtilisateurRepository utilisateurRepository)
    {
        _utilisateurRepository = utilisateurRepository;
    }

    public async Task ExecuterAsync(ChangerRoleRequest request, CancellationToken ct = default)
    {
        var utilisateur = await _utilisateurRepository.ObtenirParIdAsync(request.UtilisateurId, ct);
        if (utilisateur is null)
        {
            throw new ErreurApplicationException(
                TypeErreurApplication.RessourceNonTrouvee,
                $"Aucun utilisateur trouvé avec l'identifiant '{request.UtilisateurId}'.");
        }

        if (utilisateur.Role == RoleUtilisateur.Admin && request.NouveauRole != RoleUtilisateur.Admin)
        {
            var nombreAdmins = await _utilisateurRepository.CompterAdminsAsync(ct);
            if (nombreAdmins <= 1)
            {
                throw new ErreurApplicationException(
                    TypeErreurApplication.RegleMetierViolee,
                    "Impossible de retirer le rôle Admin au dernier administrateur restant.");
            }
        }

        utilisateur.ChangerRole(request.NouveauRole);
        await _utilisateurRepository.MettreAJourAsync(utilisateur, ct);
    }
}
