namespace RestosVisites.Application.UseCases.ModifierRestaurant;

public sealed record ModifierRestaurantRequest(
    Guid RestaurantId,
    string Nom,
    string Adresse,
    double Latitude,
    double Longitude,
    IReadOnlyCollection<Guid> CategorieIds,
    string? Description = null,
    string? Telephone = null,
    string? SiteWeb = null,
    string? Horaires = null);
