using RestosVisites.Application.Abstractions;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.UseCases.ListerCategories;

/// <summary>
/// Cas d'usage : lister l'ensemble du catalogue de catégories prédéfinies, trié par groupe puis
/// par nom pour faciliter l'affichage.
/// </summary>
public sealed class ListerCategories
{
    private readonly ICategorieRepository _categorieRepository;

    public ListerCategories(ICategorieRepository categorieRepository)
    {
        _categorieRepository = categorieRepository;
    }

    public async Task<IReadOnlyList<CategorieDto>> ExecuterAsync(CancellationToken ct = default)
    {
        var categories = await _categorieRepository.ListerAsync(ct);

        return categories
            .OrderBy(c => c.Groupe, StringComparer.Ordinal)
            .ThenBy(c => c.Nom, StringComparer.Ordinal)
            .Select(VersDto)
            .ToList();
    }

    private static CategorieDto VersDto(Categorie categorie) => new(categorie.Id, categorie.Nom, categorie.Groupe);
}
