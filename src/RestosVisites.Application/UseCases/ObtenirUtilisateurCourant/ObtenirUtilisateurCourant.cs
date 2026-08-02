using RestosVisites.Application.Abstractions;
using RestosVisites.Application.Exceptions;

namespace RestosVisites.Application.UseCases.ObtenirUtilisateurCourant;

/// <summary>
/// Cas d'usage : obtenir les informations de l'utilisateur actuellement authentifié (endpoint "me").
/// </summary>
public sealed class ObtenirUtilisateurCourant
{
    private readonly IUtilisateurRepository _utilisateurRepository;

    public ObtenirUtilisateurCourant(IUtilisateurRepository utilisateurRepository)
    {
        _utilisateurRepository = utilisateurRepository;
    }

    public async Task<ObtenirUtilisateurCourantResponse> ExecuterAsync(ObtenirUtilisateurCourantRequest request, CancellationToken ct = default)
    {
        var utilisateur = await _utilisateurRepository.ObtenirParIdAsync(request.UtilisateurId, ct);
        if (utilisateur is null)
        {
            throw new ErreurApplicationException(
                TypeErreurApplication.RessourceNonTrouvee,
                $"Aucun utilisateur trouvé avec l'identifiant '{request.UtilisateurId}'.");
        }

        return new ObtenirUtilisateurCourantResponse(utilisateur.Id, utilisateur.Email, utilisateur.NomAffiche, utilisateur.Role);
    }
}
