using RestosVisites.Application.Abstractions;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.Tests.Fakes;

/// <summary>
/// Fake en mémoire de <see cref="IFavoriRestaurantRepository"/>, réutilisable entre les tests.
/// </summary>
public sealed class FakeFavoriRestaurantRepository : IFavoriRestaurantRepository
{
    private readonly List<FavoriRestaurant> _favoris = [];

    public IReadOnlyList<FavoriRestaurant> Favoris => _favoris;

    public Task AjouterAsync(FavoriRestaurant favori, CancellationToken ct)
    {
        _favoris.Add(favori);
        return Task.CompletedTask;
    }

    public Task<FavoriRestaurant?> ObtenirAsync(Guid utilisateurId, Guid restaurantId, CancellationToken ct)
    {
        var favori = _favoris.FirstOrDefault(f => f.UtilisateurId == utilisateurId && f.RestaurantId == restaurantId);
        return Task.FromResult(favori);
    }

    public Task<IReadOnlyList<FavoriRestaurant>> ListerParUtilisateurAsync(Guid utilisateurId, CancellationToken ct)
    {
        var favoris = _favoris.Where(f => f.UtilisateurId == utilisateurId).ToList();
        return Task.FromResult<IReadOnlyList<FavoriRestaurant>>(favoris);
    }

    public Task SupprimerAsync(Guid utilisateurId, Guid restaurantId, CancellationToken ct)
    {
        _favoris.RemoveAll(f => f.UtilisateurId == utilisateurId && f.RestaurantId == restaurantId);
        return Task.CompletedTask;
    }
}
