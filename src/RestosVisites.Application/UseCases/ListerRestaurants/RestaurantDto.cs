using RestosVisites.Application.UseCases.ListerCategories;

namespace RestosVisites.Application.UseCases.ListerRestaurants;

public sealed record RestaurantDto(
    Guid Id,
    string Nom,
    string Adresse,
    double Latitude,
    double Longitude,
    IReadOnlyList<CategorieDto> Categories);
