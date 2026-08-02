using RestosVisites.Application.Abstractions;

namespace RestosVisites.Application.UseCases.ListerUtilisateursAvecFavoris;

/// <summary>
/// Cas d'usage : lister l'ensemble des utilisateurs avec leurs restaurants favoris (annuaire),
/// en enrichissant chaque favori du nom du restaurant afin que le frontend n'ait pas besoin de le
/// croiser lui-même avec la liste des restaurants.
/// </summary>
public sealed class ListerUtilisateursAvecFavoris
{
    private readonly IUtilisateurRepository _utilisateurRepository;
    private readonly IFavoriRestaurantRepository _favoriRestaurantRepository;
    private readonly IRestaurantRepository _restaurantRepository;

    public ListerUtilisateursAvecFavoris(
        IUtilisateurRepository utilisateurRepository,
        IFavoriRestaurantRepository favoriRestaurantRepository,
        IRestaurantRepository restaurantRepository)
    {
        _utilisateurRepository = utilisateurRepository;
        _favoriRestaurantRepository = favoriRestaurantRepository;
        _restaurantRepository = restaurantRepository;
    }

    public async Task<IReadOnlyList<UtilisateurAvecFavorisDto>> ExecuterAsync(CancellationToken ct = default)
    {
        var utilisateurs = await _utilisateurRepository.ListerUtilisateursReelsAsync(ct);
        var restaurants = await _restaurantRepository.ListerAsync(ct);
        var restaurantsParId = restaurants.ToDictionary(r => r.Id);

        var resultat = new List<UtilisateurAvecFavorisDto>();

        foreach (var utilisateur in utilisateurs)
        {
            var favoris = await _favoriRestaurantRepository.ListerParUtilisateurAsync(utilisateur.Id, ct);
            var favorisDto = favoris
                .Where(f => restaurantsParId.ContainsKey(f.RestaurantId))
                .Select(f => new FavoriDto(f.RestaurantId, restaurantsParId[f.RestaurantId].Nom, f.DateAjout))
                .ToList();

            resultat.Add(new UtilisateurAvecFavorisDto(utilisateur.Id, utilisateur.Email, utilisateur.NomAffiche, utilisateur.Role, favorisDto));
        }

        return resultat;
    }
}
