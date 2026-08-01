namespace RestosVisites.Application.UseCases.ModifierVisite;

public sealed record ModifierVisiteRequest(
    Guid VisiteId,
    DateOnly Date,
    int Note,
    string? Commentaire,
    IReadOnlyList<string> NomsCategories,
    IReadOnlyList<string> UrlsPhotos);
