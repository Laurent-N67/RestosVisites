using System.Security.Claims;
using RestosVisites.Domain.Enums;

namespace RestosVisites.Api;

/// <summary>
/// Extraction des informations de l'utilisateur courant depuis les claims du cookie
/// d'authentification, utilisée par les contrôleurs pour ne jamais faire confiance à un identifiant
/// utilisateur ou un rôle fourni par le client dans le corps d'une requête.
/// </summary>
internal static class ClaimsPrincipalExtensions
{
    /// <summary>
    /// Identifiant de l'utilisateur courant. Les contrôleurs qui l'utilisent sont toujours protégés
    /// par <c>[Authorize]</c> : ce claim est donc garanti présent, sauf bug de câblage de l'authentification.
    /// </summary>
    public static Guid ObtenirUtilisateurId(this ClaimsPrincipal principal)
    {
        var valeur = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (valeur is null || !Guid.TryParse(valeur, out var id))
        {
            throw new InvalidOperationException("Utilisateur non authentifié ou claim d'identifiant manquant.");
        }

        return id;
    }

    public static RoleUtilisateur ObtenirRole(this ClaimsPrincipal principal)
    {
        var valeur = principal.FindFirstValue(ClaimTypes.Role);
        if (valeur is null || !Enum.TryParse<RoleUtilisateur>(valeur, out var role))
        {
            throw new InvalidOperationException("Utilisateur non authentifié ou claim de rôle manquant.");
        }

        return role;
    }
}
