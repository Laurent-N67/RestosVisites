using RestosVisites.Application.Abstractions;
using RestosVisites.Application.Exceptions;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.UseCases.AjouterFavori;

/// <summary>
/// Cas d'usage : ajouter un restaurant aux favoris de l'utilisateur courant. Idempotent (ajouter
/// un favori déjà présent n'a aucun effet) et limité à 6 favoris par utilisateur.
/// </summary>
public sealed class AjouterFavori
{
    private const int MaxFavorisParUtilisateur = 6;

    private readonly IFavoriRestaurantRepository _favoriRestaurantRepository;
    private readonly IRestaurantRepository _restaurantRepository;

    public AjouterFavori(IFavoriRestaurantRepository favoriRestaurantRepository, IRestaurantRepository restaurantRepository)
    {
        _favoriRestaurantRepository = favoriRestaurantRepository;
        _restaurantRepository = restaurantRepository;
    }

    public async Task ExecuterAsync(AjouterFavoriRequest request, CancellationToken ct = default)
    {
        var restaurant = await _restaurantRepository.ObtenirParIdAsync(request.RestaurantId, ct);
        if (restaurant is null)
        {
            throw new ErreurApplicationException(
                TypeErreurApplication.RessourceNonTrouvee,
                $"Aucun restaurant trouvé avec l'identifiant '{request.RestaurantId}'.");
        }

        var favoriExistant = await _favoriRestaurantRepository.ObtenirAsync(request.UtilisateurId, request.RestaurantId, ct);
        if (favoriExistant is not null)
        {
            return;
        }

        var favorisActuels = await _favoriRestaurantRepository.ListerParUtilisateurAsync(request.UtilisateurId, ct);
        if (favorisActuels.Count >= MaxFavorisParUtilisateur)
        {
            throw new ErreurApplicationException(
                TypeErreurApplication.RegleMetierViolee,
                $"Le nombre maximal de restaurants favoris ({MaxFavorisParUtilisateur}) est déjà atteint.");
        }

        var favori = new FavoriRestaurant(request.UtilisateurId, request.RestaurantId, DateTimeOffset.UtcNow);
        await _favoriRestaurantRepository.AjouterAsync(favori, ct);
    }
}
