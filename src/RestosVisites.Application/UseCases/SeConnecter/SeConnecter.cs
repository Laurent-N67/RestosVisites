using RestosVisites.Application.Abstractions;
using RestosVisites.Application.Exceptions;

namespace RestosVisites.Application.UseCases.SeConnecter;

/// <summary>
/// Cas d'usage : authentifier un utilisateur par email et mot de passe. Le même message d'erreur
/// générique est utilisé que l'email soit inconnu ou le mot de passe incorrect, afin de ne pas
/// révéler à un attaquant si une adresse email est déjà associée à un compte.
/// </summary>
public sealed class SeConnecter
{
    private const string MessageErreurGenerique = "Email ou mot de passe incorrect.";

    private readonly IUtilisateurRepository _utilisateurRepository;
    private readonly IMotDePasseHasher _motDePasseHasher;

    public SeConnecter(IUtilisateurRepository utilisateurRepository, IMotDePasseHasher motDePasseHasher)
    {
        _utilisateurRepository = utilisateurRepository;
        _motDePasseHasher = motDePasseHasher;
    }

    public async Task<SeConnecterResponse> ExecuterAsync(SeConnecterRequest request, CancellationToken ct = default)
    {
        var utilisateur = await _utilisateurRepository.ObtenirParEmailAsync(request.Email, ct);
        if (utilisateur is null ||
            !_motDePasseHasher.Verifier(request.MotDePasse, utilisateur.MotDePasseHash, utilisateur.MotDePasseSel, utilisateur.MotDePasseIterations))
        {
            throw new ErreurApplicationException(TypeErreurApplication.NonAutorise, MessageErreurGenerique);
        }

        return new SeConnecterResponse(utilisateur.Id, utilisateur.Email, utilisateur.NomAffiche, utilisateur.Role);
    }
}
