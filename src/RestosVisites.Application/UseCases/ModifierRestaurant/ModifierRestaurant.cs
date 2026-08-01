using RestosVisites.Application.Abstractions;
using RestosVisites.Application.Exceptions;

namespace RestosVisites.Application.UseCases.ModifierRestaurant;

/// <summary>
/// Cas d'usage : modifier un restaurant existant, en évitant les doublons (même nom et même
/// adresse) avec un autre restaurant.
/// </summary>
public sealed class ModifierRestaurant
{
    private readonly IRestaurantRepository _restaurantRepository;

    public ModifierRestaurant(IRestaurantRepository restaurantRepository)
    {
        _restaurantRepository = restaurantRepository;
    }

    public async Task ExecuterAsync(ModifierRestaurantRequest request, CancellationToken ct = default)
    {
        var restaurant = await _restaurantRepository.ObtenirParIdAsync(request.RestaurantId, ct);
        if (restaurant is null)
        {
            throw new ErreurApplicationException(
                TypeErreurApplication.RessourceNonTrouvee,
                $"Aucun restaurant trouvé avec l'identifiant '{request.RestaurantId}'.");
        }

        var restaurantExistant = await _restaurantRepository.ObtenirParNomEtAdresseAsync(request.Nom, request.Adresse, ct);
        if (restaurantExistant is not null && restaurantExistant.Id != request.RestaurantId)
        {
            throw new ErreurApplicationException(
                TypeErreurApplication.ConflitDeDonnees,
                $"Un restaurant nommé '{request.Nom}' existe déjà à l'adresse '{request.Adresse}'.");
        }

        restaurant.Modifier(request.Nom, request.Adresse, request.Latitude, request.Longitude);
        await _restaurantRepository.MettreAJourAsync(restaurant, ct);
    }
}
