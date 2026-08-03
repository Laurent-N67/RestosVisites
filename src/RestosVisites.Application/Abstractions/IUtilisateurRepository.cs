using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.Abstractions;

/// <summary>
/// Port de persistance pour les utilisateurs.
/// </summary>
public interface IUtilisateurRepository
{
    Task AjouterAsync(Utilisateur utilisateur, CancellationToken ct);

    Task<Utilisateur?> ObtenirParIdAsync(Guid id, CancellationToken ct);

    Task<Utilisateur?> ObtenirParEmailAsync(string email, CancellationToken ct);

    Task<IReadOnlyList<Utilisateur>> ListerAsync(CancellationToken ct);

    /// <summary>
    /// Liste les utilisateurs "réels" (hors utilisateur historique servant uniquement à rattacher
    /// les visites créées avant l'introduction des comptes), pour l'annuaire des utilisateurs — à
    /// l'inverse de <see cref="ListerAsync"/>, qui doit inclure l'utilisateur historique pour que
    /// les anciennes visites puissent afficher un nom d'auteur.
    /// </summary>
    Task<IReadOnlyList<Utilisateur>> ListerUtilisateursReelsAsync(CancellationToken ct);

    /// <summary>
    /// Indique si au moins un utilisateur "réel" existe déjà (hors utilisateur historique servant
    /// uniquement à rattacher les visites créées avant l'introduction des comptes), utilisé par la
    /// règle du premier inscrit devenant automatiquement Admin.
    /// </summary>
    Task<bool> ExisteAuMoinsUnUtilisateurReelAsync(CancellationToken ct);

    /// <summary>Compte le nombre d'utilisateurs ayant le rôle Admin, pour empêcher de retirer ce rôle au dernier.</summary>
    Task<int> CompterAdminsAsync(CancellationToken ct);

    Task MettreAJourAsync(Utilisateur utilisateur, CancellationToken ct);

    /// <summary>
    /// Indique si l'identifiant donné est celui de l'utilisateur historique (LegacyUtilisateurSeed)
    /// servant uniquement à rattacher les visites créées avant l'introduction des comptes, pour
    /// empêcher sa suppression.
    /// </summary>
    Task<bool> EstUtilisateurHistoriqueAsync(Guid id, CancellationToken ct);

    Task SupprimerAsync(Guid id, CancellationToken ct);
}
