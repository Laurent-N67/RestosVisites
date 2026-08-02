using RestosVisites.Domain.Enums;

namespace RestosVisites.Application.UseCases.ListerUtilisateursAvecFavoris;

/// <summary>
/// <see cref="Email"/> vaut <c>null</c> quand l'utilisateur courant n'est ni Admin ni le propriétaire
/// de cette fiche : l'annuaire ne doit pas exposer les adresses email des autres utilisateurs à de
/// simples membres.
/// </summary>
public sealed record UtilisateurAvecFavorisDto(
    Guid Id,
    string? Email,
    string NomAffiche,
    RoleUtilisateur Role,
    IReadOnlyList<FavoriDto> Favoris);
