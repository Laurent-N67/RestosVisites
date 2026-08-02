using RestosVisites.Application.Abstractions;
using RestosVisites.Application.Exceptions;
using RestosVisites.Application.Services;
using RestosVisites.Domain.Entities;
using RestosVisites.Domain.Enums;

namespace RestosVisites.Application.UseCases.Inscrire;

/// <summary>
/// Cas d'usage : inscrire un nouvel utilisateur. Le tout premier compte réellement inscrit
/// (hors utilisateur historique de rattachement des anciennes visites) devient automatiquement
/// Admin ; les suivants sont Simple.
/// </summary>
public sealed class Inscrire
{
    private readonly IUtilisateurRepository _utilisateurRepository;
    private readonly IMotDePasseHasher _motDePasseHasher;

    public Inscrire(IUtilisateurRepository utilisateurRepository, IMotDePasseHasher motDePasseHasher)
    {
        _utilisateurRepository = utilisateurRepository;
        _motDePasseHasher = motDePasseHasher;
    }

    public async Task<InscrireResponse> ExecuterAsync(InscrireRequest request, CancellationToken ct = default)
    {
        PolitiqueMotDePasseValidator.Valider(request.MotDePasse);

        var utilisateurExistant = await _utilisateurRepository.ObtenirParEmailAsync(request.Email, ct);
        if (utilisateurExistant is not null)
        {
            throw new ErreurApplicationException(
                TypeErreurApplication.ConflitDeDonnees,
                $"Un compte existe déjà avec l'adresse '{request.Email}'.");
        }

        var existeDejaUnUtilisateurReel = await _utilisateurRepository.ExisteAuMoinsUnUtilisateurReelAsync(ct);
        var role = existeDejaUnUtilisateurReel ? RoleUtilisateur.Simple : RoleUtilisateur.Admin;

        var resultatHachage = _motDePasseHasher.Hacher(request.MotDePasse);

        var utilisateur = new Utilisateur(
            request.Email,
            request.NomAffiche,
            resultatHachage.Hash,
            resultatHachage.Sel,
            resultatHachage.Iterations,
            role);

        await _utilisateurRepository.AjouterAsync(utilisateur, ct);

        return new InscrireResponse(utilisateur.Id, utilisateur.Email, utilisateur.NomAffiche, utilisateur.Role);
    }
}
