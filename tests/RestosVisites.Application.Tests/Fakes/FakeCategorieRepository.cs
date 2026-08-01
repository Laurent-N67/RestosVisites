using RestosVisites.Application.Abstractions;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.Tests.Fakes;

/// <summary>
/// Fake en mémoire de <see cref="ICategorieRepository"/>, réutilisable entre les tests.
/// </summary>
public sealed class FakeCategorieRepository : ICategorieRepository
{
    private readonly List<Categorie> _categories = [];

    public IReadOnlyList<Categorie> Categories => _categories;

    /// <summary>
    /// Ajoute une catégorie au catalogue fake, pour préparer un scénario de test (le catalogue
    /// n'étant plus alimenté à la volée par les cas d'usage).
    /// </summary>
    public void Ajouter(Categorie categorie)
    {
        _categories.Add(categorie);
    }

    public Task<Categorie?> ObtenirParIdAsync(Guid id, CancellationToken ct)
    {
        var categorie = _categories.FirstOrDefault(c => c.Id == id);
        return Task.FromResult(categorie);
    }

    public Task<IReadOnlyList<Categorie>> ListerAsync(CancellationToken ct)
    {
        return Task.FromResult<IReadOnlyList<Categorie>>(_categories.ToList());
    }
}
