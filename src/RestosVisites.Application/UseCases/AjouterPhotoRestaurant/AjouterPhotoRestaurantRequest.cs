namespace RestosVisites.Application.UseCases.AjouterPhotoRestaurant;

public sealed record AjouterPhotoRestaurantRequest(Guid RestaurantId, string Url);
