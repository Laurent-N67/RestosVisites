using RestosVisites.Application.Abstractions;
using RestosVisites.Application.Exceptions;
using RestosVisites.Domain.Entities;
using RestosVisites.Domain.ValueObjects;

namespace RestosVisites.Application.UseCases.EnregistrerVisite;

/// <summary>
/// Cas d'usage : enregistrer une visite pour un restaurant existant, en associant les photos.
/// </summary>
public sealed class EnregistrerVisite
{
    private readonly IRestaurantRepository _restaurantRepository;
    private readonly IVisiteRepository _visiteRepository;

    public EnregistrerVisite(IRestaurantRepository restaurantRepository, IVisiteRepository visiteRepository)
    {
        _restaurantRepository = restaurantRepository;
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

        var visite = new Visite(
            restaurant.Id,
            request.UtilisateurId,
            request.Date,
            new Note(request.Note),
            request.Commentaire,
            request.AvecQui,
            request.Reservation,
            request.Budget,
            request.TempsAttente);

        foreach (var urlPhoto in request.UrlsPhotos)
        {
            visite.AjouterPhoto(new Photo(urlPhoto));
        }

        await _visiteRepository.AjouterAsync(visite, ct);

        return new EnregistrerVisiteResponse(visite.Id);
    }
}
