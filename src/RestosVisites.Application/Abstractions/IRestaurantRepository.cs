using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.Abstractions;

/// <summary>
/// Port de persistance pour les restaurants.
/// </summary>
public interface IRestaurantRepository
{
    Task AjouterAsync(Restaurant restaurant, CancellationToken ct);

    Task<Restaurant?> ObtenirParIdAsync(Guid id, CancellationToken ct);

    /// <summary>
    /// Recherche un restaurant par nom et adresse exacts, utilisé pour éviter les doublons à la création.
    /// </summary>
    Task<Restaurant?> ObtenirParNomEtAdresseAsync(string nom, string adresse, CancellationToken ct);

    Task<IReadOnlyList<Restaurant>> ListerAsync(CancellationToken ct);

    Task MettreAJourAsync(Restaurant restaurant, CancellationToken ct);

    Task SupprimerAsync(Guid id, CancellationToken ct);
}
