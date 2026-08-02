namespace RestosVisites.Application.UseCases.ListerVisitesRestaurant;

public sealed record VisiteDto(
    Guid Id,
    Guid RestaurantId,
    Guid UtilisateurId,
    string UtilisateurNomAffiche,
    DateOnly Date,
    int Note,
    string? Commentaire,
    IReadOnlyList<string> UrlsPhotos);
