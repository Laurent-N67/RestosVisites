using RestosVisites.Application.Abstractions;
using RestosVisites.Application.Exceptions;
using RestosVisites.Application.Services;

namespace RestosVisites.Application.UseCases.ReinitialiserMotDePasse;

/// <summary>
/// Cas d'usage : un Admin réinitialise directement le mot de passe d'un utilisateur de l'annuaire
/// (pas de flux email, réinitialisation immédiate décidée par l'Admin).
/// </summary>
public sealed class ReinitialiserMotDePasse
{
    private readonly IUtilisateurRepository _utilisateurRepository;
    private readonly IMotDePasseHasher _motDePasseHasher;

    public ReinitialiserMotDePasse(IUtilisateurRepository utilisateurRepository, IMotDePasseHasher motDePasseHasher)
    {
        _utilisateurRepository = utilisateurRepository;
        _motDePasseHasher = motDePasseHasher;
    }

    public async Task ExecuterAsync(ReinitialiserMotDePasseRequest request, CancellationToken ct = default)
    {
        PolitiqueMotDePasseValidator.Valider(request.NouveauMotDePasse);

        var utilisateur = await _utilisateurRepository.ObtenirParIdAsync(request.UtilisateurId, ct);
        if (utilisateur is null)
        {
            throw new ErreurApplicationException(
                TypeErreurApplication.RessourceNonTrouvee,
                $"Aucun utilisateur trouvé avec l'identifiant '{request.UtilisateurId}'.");
        }

        var resultatHachage = _motDePasseHasher.Hacher(request.NouveauMotDePasse);
        utilisateur.DefinirMotDePasse(resultatHachage.Hash, resultatHachage.Sel, resultatHachage.Iterations);

        await _utilisateurRepository.MettreAJourAsync(utilisateur, ct);
    }
}
