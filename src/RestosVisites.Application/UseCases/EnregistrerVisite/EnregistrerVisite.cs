using RestosVisites.Application.Abstractions;
using RestosVisites.Application.Exceptions;
using RestosVisites.Domain.Entities;
using RestosVisites.Domain.ValueObjects;

namespace RestosVisites.Application.UseCases.EnregistrerVisite;

/// <summary>
/// Cas d'usage : enregistrer une visite pour un restaurant existant, en résolvant les catégories
/// par nom (réutilisation si elles existent déjà, création sinon) et en associant les photos.
/// </summary>
public sealed class EnregistrerVisite
{
    private readonly IRestaurantRepository _restaurantRepository;
    private readonly ICategorieRepository _categorieRepository;
    private readonly IVisiteRepository _visiteRepository;

    public EnregistrerVisite(
        IRestaurantRepository restaurantRepository,
        ICategorieRepository categorieRepository,
        IVisiteRepository visiteRepository)
    {
        _restaurantRepository = restaurantRepository;
        _categorieRepository = categorieRepository;
        _visiteRepository = visiteRepository;
    }

    public async Task<EnregistrerVisiteResponse> ExecuterAsync(EnregistrerVisiteRequest request, CancellationToken ct = default)
    {
        var restaurant = await _restaurantRepository.ObtenirParIdAsync(request.RestaurantId, ct);
        if (restaurant is null)
        {
            throw new ErreurApplicationException(
                TypeErreurApplication.RessourceNonTrouvee,
                $"Aucun restaurant trouvé avec l'identifiant '{request.RestaurantId}'.");
        }

        var visite = new Visite(restaurant.Id, request.Date, new Note(request.Note), request.Commentaire);

        foreach (var nomCategorie in request.NomsCategories)
        {
            var categorie = await _categorieRepository.ObtenirParNomAsync(nomCategorie, ct);
            if (categorie is null)
            {
                categorie = new Categorie(nomCategorie);
                await _categorieRepository.AjouterAsync(categorie, ct);
            }

            visite.AjouterCategorie(categorie);
        }

        foreach (var urlPhoto in request.UrlsPhotos)
        {
            visite.AjouterPhoto(new Photo(urlPhoto));
        }

        await _visiteRepository.AjouterAsync(visite, ct);

        return new EnregistrerVisiteResponse(visite.Id);
    }
}
