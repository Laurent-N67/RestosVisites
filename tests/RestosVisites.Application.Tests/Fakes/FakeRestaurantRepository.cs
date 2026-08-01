using RestosVisites.Application.Abstractions;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.Tests.Fakes;

/// <summary>
/// Fake en mémoire de <see cref="IRestaurantRepository"/>, réutilisable entre les tests.
/// </summary>
public sealed class FakeRestaurantRepository : IRestaurantRepository
{
    private readonly List<Restaurant> _restaurants = [];

    public IReadOnlyList<Restaurant> Restaurants => _restaurants;

    public Task AjouterAsync(Restaurant restaurant, CancellationToken ct)
    {
        _restaurants.Add(restaurant);
        return Task.CompletedTask;
    }

    public Task<Restaurant?> ObtenirParIdAsync(Guid id, CancellationToken ct)
    {
        var restaurant = _restaurants.FirstOrDefault(r => r.Id == id);
        return Task.FromResult(restaurant);
    }

    public Task<Restaurant?> ObtenirParNomEtAdresseAsync(string nom, string adresse, CancellationToken ct)
    {
        var restaurant = _restaurants.FirstOrDefault(r =>
            string.Equals(r.Nom, nom, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(r.Adresse, adresse, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(restaurant);
    }

    public Task<IReadOnlyList<Restaurant>> ListerAsync(CancellationToken ct)
    {
        return Task.FromResult<IReadOnlyList<Restaurant>>(_restaurants.ToList());
    }

    public Task MettreAJourAsync(Restaurant restaurant, CancellationToken ct)
    {
        return Task.CompletedTask;
    }

    public Task SupprimerAsync(Guid id, CancellationToken ct)
    {
        _restaurants.RemoveAll(r => r.Id == id);
        return Task.CompletedTask;
    }
}
