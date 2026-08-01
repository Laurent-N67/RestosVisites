using RestosVisites.Application.Abstractions;
using RestosVisites.Application.Exceptions;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.UseCases.ModifierRestaurant;

/// <summary>
/// Cas d'usage : modifier un restaurant existant, en évitant les doublons (même nom et même
/// adresse) avec un autre restaurant et en remplaçant entièrement l'ensemble de ses catégories.
/// </summary>
public sealed class ModifierRestaurant
{
    private readonly IRestaurantRepository _restaurantRepository;
    private readonly ICategorieRepository _categorieRepository;

    public ModifierRestaurant(IRestaurantRepository restaurantRepository, ICategorieRepository categorieRepository)
    {
        _restaurantRepository = restaurantRepository;
        _categorieRepository = categorieRepository;
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

        var categories = await ResoudreCategoriesAsync(request.CategorieIds, ct);

        restaurant.Modifier(request.Nom, request.Adresse, request.Latitude, request.Longitude);
        restaurant.DefinirCategories(categories);
        await _restaurantRepository.MettreAJourAsync(restaurant, ct);
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
