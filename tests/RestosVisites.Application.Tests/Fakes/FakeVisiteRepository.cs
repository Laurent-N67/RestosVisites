using RestosVisites.Application.Abstractions;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.Tests.Fakes;

/// <summary>
/// Fake en mémoire de <see cref="IVisiteRepository"/>, réutilisable entre les tests.
/// </summary>
public sealed class FakeVisiteRepository : IVisiteRepository
{
    private readonly List<Visite> _visites = [];

    public IReadOnlyList<Visite> Visites => _visites;

    public Task AjouterAsync(Visite visite, CancellationToken ct)
    {
        _visites.Add(visite);
        return Task.CompletedTask;
    }

    public Task<Visite?> ObtenirParIdAsync(Guid id, CancellationToken ct)
    {
        var visite = _visites.FirstOrDefault(v => v.Id == id);
        return Task.FromResult(visite);
    }

    public Task<IReadOnlyList<Visite>> ListerParRestaurantAsync(Guid restaurantId, CancellationToken ct)
    {
        var visites = _visites.Where(v => v.RestaurantId == restaurantId).ToList();
        return Task.FromResult<IReadOnlyList<Visite>>(visites);
    }

    public Task<IReadOnlyList<Visite>> ListerToutesAsync(CancellationToken ct)
    {
        return Task.FromResult<IReadOnlyList<Visite>>(_visites.ToList());
    }

    public Task MettreAJourAsync(Visite visite, CancellationToken ct)
    {
        return Task.CompletedTask;
    }

    public Task SupprimerAsync(Guid id, CancellationToken ct)
    {
        _visites.RemoveAll(v => v.Id == id);
        return Task.CompletedTask;
    }
}
