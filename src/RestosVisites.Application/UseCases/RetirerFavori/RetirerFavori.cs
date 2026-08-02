using RestosVisites.Application.Abstractions;

namespace RestosVisites.Application.UseCases.RetirerFavori;

/// <summary>
/// Cas d'usage : retirer un restaurant des favoris de l'utilisateur courant. Idempotent : n'a
/// aucun effet si le favori n'existe pas.
/// </summary>
public sealed class RetirerFavori
{
    private readonly IFavoriRestaurantRepository _favoriRestaurantRepository;

    public RetirerFavori(IFavoriRestaurantRepository favoriRestaurantRepository)
    {
        _favoriRestaurantRepository = favoriRestaurantRepository;
    }

    public async Task ExecuterAsync(RetirerFavoriRequest request, CancellationToken ct = default)
    {
        await _favoriRestaurantRepository.SupprimerAsync(request.UtilisateurId, request.RestaurantId, ct);
    }
}
