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
    private readonly ICategorieRepository _categorieRepository;

    public CreerRestaurant(IRestaurantRepository restaurantRepository, ICategorieRepository categorieRepository)
    {
        _restaurantRepository = restaurantRepository;
        _categorieRepository = categorieRepository;
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

        var categories = await ResoudreCategoriesAsync(request.CategorieIds, ct);

        var restaurant = new Restaurant(request.Nom, request.Adresse, request.Latitude, request.Longitude, categories);
        await _restaurantRepository.AjouterAsync(restaurant, ct);

        return new CreerRestaurantResponse(restaurant.Id);
    }

    private async Task<List<Categorie>> ResoudreCategoriesAsync(IReadOnlyCollection<Guid> categorieIds, CancellationToken ct)
    {
        var categories = new List<Categorie>();

        foreach (var categorieId in categorieIds)
        {
            var categorie = await _categorieRepository.ObtenirParIdAsync(categorieId, ct);
            if (categorie is null)
            {
                throw new ErreurApplicationException(
                    TypeErreurApplication.RessourceNonTrouvee,
                    $"Aucune catégorie trouvée avec l'identifiant '{categorieId}'.");
            }

            categories.Add(categorie);
        }

        return categories;
    }
}
