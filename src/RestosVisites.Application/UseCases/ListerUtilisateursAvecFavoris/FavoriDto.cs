namespace RestosVisites.Application.UseCases.ListerUtilisateursAvecFavoris;

public sealed record FavoriDto(Guid RestaurantId, string RestaurantNom, DateTimeOffset DateAjout);
