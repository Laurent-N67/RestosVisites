using RestosVisites.Application.Abstractions;
using RestosVisites.Application.Exceptions;
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
    private const int LongueurMinimale = 12;

    private readonly IUtilisateurRepository _utilisateurRepository;
    private readonly IMotDePasseHasher _motDePasseHasher;

    public Inscrire(IUtilisateurRepository utilisateurRepository, IMotDePasseHasher motDePasseHasher)
    {
        _utilisateurRepository = utilisateurRepository;
        _motDePasseHasher = motDePasseHasher;
    }

    public async Task<InscrireResponse> ExecuterAsync(InscrireRequest request, CancellationToken ct = default)
    {
        ValiderPolitiqueMotDePasse(request.MotDePasse);

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

    /// <summary>
    /// Valide la politique de complexité du mot de passe EN CLAIR (avant hachage) : minimum 12
    /// caractères, au moins une majuscule, un chiffre et un caractère spécial. Règle d'inscription
    /// non négociable côté utilisateur, donc vérifiée ici plutôt que dans le Domain (qui ne voit
    /// jamais le mot de passe en clair).
    /// </summary>
    private static void ValiderPolitiqueMotDePasse(string? motDePasse)
    {
        var motDePasseEffectif = motDePasse ?? string.Empty;
        var violations = new List<string>();

        if (motDePasseEffectif.Length < LongueurMinimale)
        {
            violations.Add($"au moins {LongueurMinimale} caractères");
        }

        if (!motDePasseEffectif.Any(char.IsUpper))
        {
            violations.Add("au moins une majuscule");
        }

        if (!motDePasseEffectif.Any(char.IsDigit))
        {
            violations.Add("au moins un chiffre");
        }

        if (!motDePasseEffectif.Any(c => !char.IsLetterOrDigit(c)))
        {
            violations.Add("au moins un caractère spécial");
        }

        if (violations.Count > 0)
        {
            throw new ErreurApplicationException(
                TypeErreurApplication.RegleMetierViolee,
                $"Le mot de passe ne respecte pas les règles suivantes : {string.Join(", ", violations)}.");
        }
    }
}
