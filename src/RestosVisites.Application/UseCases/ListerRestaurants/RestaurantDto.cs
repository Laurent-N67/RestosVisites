using RestosVisites.Application.UseCases.ListerCategories;

namespace RestosVisites.Application.UseCases.ListerRestaurants;

public sealed record RestaurantDto(
    Guid Id,
    string Nom,
    string Adresse,
    double Latitude,
    double Longitude,
    IReadOnlyList<CategorieDto> Categories,
    string? Description,
    string? Telephone,
    string? SiteWeb,
    string? Horaires,
    IReadOnlyList<RestaurantPhotoDto> Photos);

public sealed record RestaurantPhotoDto(Guid Id, string Url, bool EstPrincipale, int Ordre);
