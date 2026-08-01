using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.Abstractions;

/// <summary>
/// Port de persistance pour le catalogue prédéfini de catégories.
/// </summary>
public interface ICategorieRepository
{
    Task<Categorie?> ObtenirParIdAsync(Guid id, CancellationToken ct);

    Task<IReadOnlyList<Categorie>> ListerAsync(CancellationToken ct);
}
