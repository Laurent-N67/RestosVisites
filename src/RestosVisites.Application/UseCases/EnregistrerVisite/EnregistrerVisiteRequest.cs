namespace RestosVisites.Application.UseCases.EnregistrerVisite;

public sealed record EnregistrerVisiteRequest(
    Guid RestaurantId,
    Guid UtilisateurId,
    DateOnly Date,
    int Note,
    string? Commentaire,
    IReadOnlyList<string> UrlsPhotos);
