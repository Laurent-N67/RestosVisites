using RestosVisites.Application.Abstractions;
using RestosVisites.Application.Exceptions;
using RestosVisites.Application.Services;

namespace RestosVisites.Application.UseCases.ChangerMotDePasse;

/// <summary>
/// Cas d'usage : un utilisateur change son propre mot de passe (libre-service, tout rôle
/// confondu), en confirmant son mot de passe actuel — contrairement à la réinitialisation par un
/// Admin, qui n'a pas besoin de le connaître.
/// </summary>
public sealed class ChangerMotDePasse
{
    private readonly IUtilisateurRepository _utilisateurRepository;
    private readonly IMotDePasseHasher _motDePasseHasher;

    public ChangerMotDePasse(IUtilisateurRepository utilisateurRepository, IMotDePasseHasher motDePasseHasher)
    {
        _utilisateurRepository = utilisateurRepository;
        _motDePasseHasher = motDePasseHasher;
    }

    public async Task ExecuterAsync(ChangerMotDePasseRequest request, CancellationToken ct = default)
    {
        var utilisateur = await _utilisateurRepository.ObtenirParIdAsync(request.UtilisateurId, ct);
        if (utilisateur is null)
        {
            throw new ErreurApplicationException(
                TypeErreurApplication.RessourceNonTrouvee,
                $"Aucun utilisateur trouvé avec l'identifiant '{request.UtilisateurId}'.");
        }

        if (!_motDePasseHasher.Verifier(
                request.MotDePasseActuel, utilisateur.MotDePasseHash, utilisateur.MotDePasseSel, utilisateur.MotDePasseIterations))
        {
            throw new ErreurApplicationException(TypeErreurApplication.NonAutorise, "Mot de passe actuel incorrect.");
        }

        PolitiqueMotDePasseValidator.Valider(request.NouveauMotDePasse);

        var resultatHachage = _motDePasseHasher.Hacher(request.NouveauMotDePasse);
        utilisateur.DefinirMotDePasse(resultatHachage.Hash, resultatHachage.Sel, resultatHachage.Iterations);

        await _utilisateurRepository.MettreAJourAsync(utilisateur, ct);
    }
}
