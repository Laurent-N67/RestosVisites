namespace RestosVisites.Application.UseCases.ListerMesFavoris;

public sealed record MonFavoriDto(Guid RestaurantId, DateTimeOffset DateAjout);
