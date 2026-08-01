using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.Abstractions;

/// <summary>
/// Port de persistance pour les visites.
/// </summary>
public interface IVisiteRepository
{
    Task AjouterAsync(Visite visite, CancellationToken ct);

    Task<Visite?> ObtenirParIdAsync(Guid id, CancellationToken ct);

    Task<IReadOnlyList<Visite>> ListerParRestaurantAsync(Guid restaurantId, CancellationToken ct);

    Task<IReadOnlyList<Visite>> ListerToutesAsync(CancellationToken ct);

    Task MettreAJourAsync(Visite visite, CancellationToken ct);

    Task SupprimerAsync(Guid id, CancellationToken ct);
}
