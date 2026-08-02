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
    private readonly IUtilisateurRepository _utilisateurRepository;

    public ListerVisitesRestaurant(
        IRestaurantRepository restaurantRepository,
        IVisiteRepository visiteRepository,
        IUtilisateurRepository utilisateurRepository)
    {
        _restaurantRepository = restaurantRepository;
        _visiteRepository = visiteRepository;
        _utilisateurRepository = utilisateurRepository;
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
        var utilisateurs = await _utilisateurRepository.ListerAsync(ct);
        var nomsParUtilisateur = utilisateurs.ToDictionary(u => u.Id, u => u.NomAffiche);

        return visites.Select(v => VersDto(v, nomsParUtilisateur)).ToList();
    }

    private static VisiteDto VersDto(Visite visite, IReadOnlyDictionary<Guid, string> nomsParUtilisateur) => new(
        visite.Id,
        visite.RestaurantId,
        visite.UtilisateurId,
        nomsParUtilisateur.TryGetValue(visite.UtilisateurId, out var nom) ? nom : "Utilisateur inconnu",
        visite.Date,
        visite.Note.Valeur,
        visite.Commentaire,
        visite.Photos.Select(p => p.Url).ToList());
}
