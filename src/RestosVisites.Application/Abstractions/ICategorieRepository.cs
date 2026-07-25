using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.Abstractions;

/// <summary>
/// Port de persistance pour les catégories de visite.
/// </summary>
public interface ICategorieRepository
{
    /// <summary>
    /// Recherche une catégorie par nom exact, utilisé pour réutiliser une catégorie existante
    /// plutôt que d'en créer un doublon.
    /// </summary>
    Task<Categorie?> ObtenirParNomAsync(string nom, CancellationToken ct);

    Task AjouterAsync(Categorie categorie, CancellationToken ct);

    Task<IReadOnlyList<Categorie>> ListerAsync(CancellationToken ct);
}
