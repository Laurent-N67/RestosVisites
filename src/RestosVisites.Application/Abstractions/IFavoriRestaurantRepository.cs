using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.Abstractions;

/// <summary>
/// Port de persistance pour les restaurants favoris des utilisateurs.
/// </summary>
public interface IFavoriRestaurantRepository
{
    Task AjouterAsync(FavoriRestaurant favori, CancellationToken ct);

    Task<FavoriRestaurant?> ObtenirAsync(Guid utilisateurId, Guid restaurantId, CancellationToken ct);

    Task<IReadOnlyList<FavoriRestaurant>> ListerParUtilisateurAsync(Guid utilisateurId, CancellationToken ct);

    /// <summary>Suppression idempotente : n'a aucun effet si le favori n'existe pas.</summary>
    Task SupprimerAsync(Guid utilisateurId, Guid restaurantId, CancellationToken ct);
}
