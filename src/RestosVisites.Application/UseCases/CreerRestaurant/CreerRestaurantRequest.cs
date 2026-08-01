namespace RestosVisites.Application.UseCases.CreerRestaurant;

public sealed record CreerRestaurantRequest(
    string Nom,
    string Adresse,
    double Latitude,
    double Longitude,
    IReadOnlyCollection<Guid> CategorieIds);
