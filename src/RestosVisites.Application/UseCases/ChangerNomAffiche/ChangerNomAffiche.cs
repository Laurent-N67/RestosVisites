using RestosVisites.Application.Abstractions;
using RestosVisites.Application.Exceptions;

namespace RestosVisites.Application.UseCases.ChangerNomAffiche;

/// <summary>
/// Cas d'usage : un utilisateur change son propre nom affiché (libre-service, tout rôle
/// confondu — contrairement au changement de rôle, réservé aux Admins).
/// </summary>
public sealed class ChangerNomAffiche
{
    private readonly IUtilisateurRepository _utilisateurRepository;

    public ChangerNomAffiche(IUtilisateurRepository utilisateurRepository)
    {
        _utilisateurRepository = utilisateurRepository;
    }

    public async Task ExecuterAsync(ChangerNomAfficheRequest request, CancellationToken ct = default)
    {
        var utilisateur = await _utilisateurRepository.ObtenirParIdAsync(request.UtilisateurId, ct);
        if (utilisateur is null)
        {
            throw new ErreurApplicationException(
                TypeErreurApplication.RessourceNonTrouvee,
                $"Aucun utilisateur trouvé avec l'identifiant '{request.UtilisateurId}'.");
        }

        utilisateur.Renommer(request.NouveauNomAffiche);

        await _utilisateurRepository.MettreAJourAsync(utilisateur, ct);
    }
}
