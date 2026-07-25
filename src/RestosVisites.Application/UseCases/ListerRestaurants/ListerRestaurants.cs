using RestosVisites.Application.Abstractions;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.UseCases.ListerRestaurants;

/// <summary>
/// Cas d'usage : lister l'ensemble des restaurants.
/// </summary>
public sealed class ListerRestaurants
{
    private readonly IRestaurantRepository _restaurantRepository;

    public ListerRestaurants(IRestaurantRepository restaurantRepository)
    {
        _restaurantRepository = restaurantRepository;
    }

    public async Task<IReadOnlyList<RestaurantDto>> ExecuterAsync(CancellationToken ct = default)
    {
        var restaurants = await _restaurantRepository.ListerAsync(ct);

        return restaurants.Select(VersDto).ToList();
    }

    private static RestaurantDto VersDto(Restaurant restaurant) => new(restaurant.Id, restaurant.Nom, restaurant.Adresse, restaurant.Latitude, restaurant.Longitude);
}
