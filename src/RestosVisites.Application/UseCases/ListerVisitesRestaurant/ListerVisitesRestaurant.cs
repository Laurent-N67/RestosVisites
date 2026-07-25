using RestosVisites.Application.Abstractions;
using RestosVisites.Application.Exceptions;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.UseCases.ListerVisitesRestaurant;

/// <summary>
/// Cas d'usage : lister les visites d'un restaurant existant.
/// </summary>
public sealed class ListerVisitesRestaurant
{
    private readonly IRestaurantRepository _restaurantRepository;
    private readonly IVisiteRepository _visiteRepository;

    public ListerVisitesRestaurant(IRestaurantRepository restaurantRepository, IVisiteRepository visiteRepository)
    {
        _restaurantRepository = restaurantRepository;
        _visiteRepository = visiteRepository;
    }

    public async Task<IReadOnlyList<VisiteDto>> ExecuterAsync(Guid restaurantId, CancellationToken ct = default)
    {
        var restaurant = await _restaurantRepository.ObtenirParIdAsync(restaurantId, ct);
        if (restaurant is null)
        {
            throw new ErreurApplicationException(
                TypeErreurApplication.RessourceNonTrouvee,
                $"Aucun restaurant trouvé avec l'identifiant '{restaurantId}'.");
        }

        var visites = await _visiteRepository.ListerParRestaurantAsync(restaurantId, ct);

        return visites.Select(VersDto).ToList();
    }

    private static VisiteDto VersDto(Visite visite) => new(
        visite.Id,
        visite.RestaurantId,
        visite.Date,
        visite.Note.Valeur,
        visite.Commentaire,
        visite.Categories.Select(c => c.Nom).ToList(),
        visite.Photos.Select(p => p.Url).ToList());
}
