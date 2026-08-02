using RestosVisites.Application.Abstractions;
using RestosVisites.Domain.Entities;
using RestosVisites.Domain.Enums;

namespace RestosVisites.Application.Tests.Fakes;

/// <summary>
/// Fake en mémoire de <see cref="IUtilisateurRepository"/>, réutilisable entre les tests.
/// </summary>
public sealed class FakeUtilisateurRepository : IUtilisateurRepository
{
    private readonly List<Utilisateur> _utilisateurs = [];

    /// <summary>
    /// Identifiants à exclure du calcul de <see cref="ExisteAuMoinsUnUtilisateurReelAsync"/>, pour
    /// simuler l'exclusion de l'utilisateur historique (LegacyUtilisateurSeed) faite côté Infrastructure.
    /// </summary>
    public HashSet<Guid> IdsUtilisateursHistoriques { get; } = [];

    public IReadOnlyList<Utilisateur> Utilisateurs => _utilisateurs;

    public Task AjouterAsync(Utilisateur utilisateur, CancellationToken ct)
    {
        _utilisateurs.Add(utilisateur);
        return Task.CompletedTask;
    }

    public Task<Utilisateur?> ObtenirParIdAsync(Guid id, CancellationToken ct)
    {
        var utilisateur = _utilisateurs.FirstOrDefault(u => u.Id == id);
        return Task.FromResult(utilisateur);
    }

    public Task<Utilisateur?> ObtenirParEmailAsync(string email, CancellationToken ct)
    {
        var utilisateur = _utilisateurs.FirstOrDefault(u => string.Equals(u.Email, email, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(utilisateur);
    }

    public Task<IReadOnlyList<Utilisateur>> ListerAsync(CancellationToken ct)
    {
        return Task.FromResult<IReadOnlyList<Utilisateur>>(_utilisateurs.ToList());
    }

    public Task<IReadOnlyList<Utilisateur>> ListerUtilisateursReelsAsync(CancellationToken ct)
    {
        var reels = _utilisateurs.Where(u => !IdsUtilisateursHistoriques.Contains(u.Id)).ToList();
        return Task.FromResult<IReadOnlyList<Utilisateur>>(reels);
    }

    public Task<bool> ExisteAuMoinsUnUtilisateurReelAsync(CancellationToken ct)
    {
        var existe = _utilisateurs.Any(u => !IdsUtilisateursHistoriques.Contains(u.Id));
        return Task.FromResult(existe);
    }

    public Task<int> CompterAdminsAsync(CancellationToken ct)
    {
        return Task.FromResult(_utilisateurs.Count(u => u.Role == RoleUtilisateur.Admin));
    }

    public Task MettreAJourAsync(Utilisateur utilisateur, CancellationToken ct)
    {
        return Task.CompletedTask;
    }
}
