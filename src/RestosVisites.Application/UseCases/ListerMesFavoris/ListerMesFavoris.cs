using RestosVisites.Application.Abstractions;

namespace RestosVisites.Application.UseCases.ListerMesFavoris;

/// <summary>
/// Cas d'usage : lister les restaurants favoris de l'utilisateur courant, sans les enrichir
/// (le frontend croise le résultat avec les restaurants/visites qu'il a déjà chargés).
/// </summary>
public sealed class ListerMesFavoris
{
    private readonly IFavoriRestaurantRepository _favoriRestaurantRepository;

    public ListerMesFavoris(IFavoriRestaurantRepository favoriRestaurantRepository)
    {
        _favoriRestaurantRepository = favoriRestaurantRepository;
    }

    public async Task<IReadOnlyList<MonFavoriDto>> ExecuterAsync(ListerMesFavorisRequest request, CancellationToken ct = default)
    {
        var favoris = await _favoriRestaurantRepository.ListerParUtilisateurAsync(request.UtilisateurId, ct);

        return favoris.Select(f => new MonFavoriDto(f.RestaurantId, f.DateAjout)).ToList();
    }
}
