namespace RestosVisites.Application.UseCases.RetirerFavori;

public sealed record RetirerFavoriRequest(Guid UtilisateurId, Guid RestaurantId);
