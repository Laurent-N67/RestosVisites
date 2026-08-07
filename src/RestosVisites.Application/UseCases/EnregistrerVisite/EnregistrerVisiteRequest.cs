using RestosVisites.Domain.Enums;

namespace RestosVisites.Application.UseCases.EnregistrerVisite;

public sealed record EnregistrerVisiteRequest(
    Guid RestaurantId,
    Guid UtilisateurId,
    DateOnly Date,
    int Note,
    string? Commentaire,
    IReadOnlyList<string> UrlsPhotos,
    Compagnie? AvecQui = null,
    Reservation? Reservation = null,
    decimal? Budget = null,
    int? TempsAttente = null);
