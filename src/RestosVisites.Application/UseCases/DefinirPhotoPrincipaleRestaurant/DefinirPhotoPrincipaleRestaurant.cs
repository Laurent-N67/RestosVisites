using RestosVisites.Application.Abstractions;
using RestosVisites.Application.Exceptions;

namespace RestosVisites.Application.UseCases.DefinirPhotoPrincipaleRestaurant;

/// <summary>
/// Cas d'usage : marquer une photo d'un restaurant comme sa photo principale.
/// </summary>
public sealed class DefinirPhotoPrincipaleRestaurant
{
    private readonly IRestaurantRepository _restaurantRepository;

    public DefinirPhotoPrincipaleRestaurant(IRestaurantRepository restaurantRepository)
    {
        _restaurantRepository = restaurantRepository;
    }

    public async Task ExecuterAsync(DefinirPhotoPrincipaleRestaurantRequest request, CancellationToken ct = default)
    {
        var restaurant = await _restaurantRepository.ObtenirParIdAsync(request.RestaurantId, ct);
        if (restaurant is null)
        {
            throw new ErreurApplicationException(
                TypeErreurApplication.RessourceNonTrouvee,
                $"Aucun restaurant trouvé avec l'identifiant '{request.RestaurantId}'.");
        }

        if (restaurant.Photos.All(p => p.Id != request.PhotoId))
        {
            throw new ErreurApplicationException(
                TypeErreurApplication.RessourceNonTrouvee,
                $"Aucune photo trouvée avec l'identifiant '{request.PhotoId}' pour ce restaurant.");
        }

        restaurant.DefinirPhotoPrincipale(request.PhotoId);
        await _restaurantRepository.MettreAJourAsync(restaurant, ct);
    }
}
