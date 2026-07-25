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

    public Task<Categorie?> ObtenirParNomAsync(string nom, CancellationToken ct)
    {
        var categorie = _categories.FirstOrDefault(c => string.Equals(c.Nom, nom, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(categorie);
    }

    public Task AjouterAsync(Categorie categorie, CancellationToken ct)
    {
        _categories.Add(categorie);
        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<Categorie>> ListerAsync(CancellationToken ct)
    {
        return Task.FromResult<IReadOnlyList<Categorie>>(_categories.ToList());
    }
}
