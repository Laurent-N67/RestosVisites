namespace RestosVisites.Application.UseCases.SupprimerPhotoRestaurant;

public sealed record SupprimerPhotoRestaurantRequest(Guid RestaurantId, Guid PhotoId);
