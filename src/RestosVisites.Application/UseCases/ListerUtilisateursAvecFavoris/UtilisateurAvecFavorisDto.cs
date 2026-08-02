using RestosVisites.Domain.Enums;

namespace RestosVisites.Application.UseCases.ListerUtilisateursAvecFavoris;

public sealed record UtilisateurAvecFavorisDto(
    Guid Id,
    string Email,
    string NomAffiche,
    RoleUtilisateur Role,
    IReadOnlyList<FavoriDto> Favoris);
