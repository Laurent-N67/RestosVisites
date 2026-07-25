using RestosVisites.Application.Abstractions;
using RestosVisites.Application.Exceptions;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.UseCases.CreerRestaurant;

/// <summary>
/// Cas d'usage : créer un nouveau restaurant, en évitant les doublons (même nom et même adresse).
/// </summary>
public sealed class CreerRestaurant
{
    private readonly IRestaurantRepository _restaurantRepository;

    public CreerRestaurant(IRestaurantRepository restaurantRepository)
    {
        _restaurantRepository = restaurantRepository;
    }

    public async Task<CreerRestaurantResponse> ExecuterAsync(CreerRestaurantRequest request, CancellationToken ct = default)
    {
        var restaurantExistant = await _restaurantRepository.ObtenirParNomEtAdresseAsync(request.Nom, request.Adresse, ct);
        if (restaurantExistant is not null)
        {
            throw new ErreurApplicationException(
                TypeErreurApplication.ConflitDeDonnees,
                $"Un restaurant nommé '{request.Nom}' existe déjà à l'adresse '{request.Adresse}'.");
        }

        var restaurant = new Restaurant(request.Nom, request.Adresse);
        await _restaurantRepository.AjouterAsync(restaurant, ct);

        return new CreerRestaurantResponse(restaurant.Id);
    }
}
