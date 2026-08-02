namespace RestosVisites.Application.UseCases.AjouterFavori;

public sealed record AjouterFavoriRequest(Guid UtilisateurId, Guid RestaurantId);
