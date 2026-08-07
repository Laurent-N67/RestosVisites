using RestosVisites.Application.Abstractions;
using RestosVisites.Application.Exceptions;

namespace RestosVisites.Application.UseCases.SupprimerPhotoRestaurant;

/// <summary>
/// Cas d'usage : supprimer une photo d'un restaurant existant.
/// </summary>
public sealed class SupprimerPhotoRestaurant
{
    private readonly IRestaurantRepository _restaurantRepository;

    public SupprimerPhotoRestaurant(IRestaurantRepository restaurantRepository)
    {
        _restaurantRepository = restaurantRepository;
    }

    public async Task ExecuterAsync(SupprimerPhotoRestaurantRequest request, CancellationToken ct = default)
    {
        var restaurant = await _restaurantRepository.ObtenirParIdAsync(request.RestaurantId, ct);
        if (restaurant is null)
        {
            throw new ErreurApplicationException(
                TypeErreurApplication.RessourceNonTrouvee,
                $"Aucun restaurant trouvé avec l'identifiant '{request.RestaurantId}'.");
        }

        restaurant.SupprimerPhoto(request.PhotoId);
        await _restaurantRepository.MettreAJourAsync(restaurant, ct);
    }
}
