using RestosVisites.Application.Abstractions;
using RestosVisites.Application.Exceptions;

namespace RestosVisites.Application.UseCases.SupprimerRestaurant;

/// <summary>
/// Cas d'usage : supprimer un restaurant existant. La suppression des visites associées est
/// gérée par la cascade de suppression déjà en place côté Infrastructure.
/// </summary>
public sealed class SupprimerRestaurant
{
    private readonly IRestaurantRepository _restaurantRepository;

    public SupprimerRestaurant(IRestaurantRepository restaurantRepository)
    {
        _restaurantRepository = restaurantRepository;
    }

    public async Task ExecuterAsync(SupprimerRestaurantRequest request, CancellationToken ct = default)
    {
        var restaurant = await _restaurantRepository.ObtenirParIdAsync(request.RestaurantId, ct);
        if (restaurant is null)
        {
            throw new ErreurApplicationException(
                TypeErreurApplication.RessourceNonTrouvee,
                $"Aucun restaurant trouvé avec l'identifiant '{request.RestaurantId}'.");
        }

        await _restaurantRepository.SupprimerAsync(request.RestaurantId, ct);
    }
}
