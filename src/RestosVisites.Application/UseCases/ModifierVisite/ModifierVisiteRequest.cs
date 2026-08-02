using RestosVisites.Domain.Enums;

namespace RestosVisites.Application.UseCases.ModifierVisite;

public sealed record ModifierVisiteRequest(
    Guid VisiteId,
    Guid UtilisateurCourantId,
    RoleUtilisateur RoleCourant,
    DateOnly Date,
    int Note,
    string? Commentaire,
    IReadOnlyList<string> UrlsPhotos);
