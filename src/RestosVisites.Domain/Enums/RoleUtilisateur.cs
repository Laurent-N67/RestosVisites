namespace RestosVisites.Domain.Enums;

/// <summary>
/// Rôle d'un utilisateur, déterminant son niveau d'autorisation dans l'application.
/// </summary>
public enum RoleUtilisateur
{
    /// <summary>Peut créer des restaurants et des visites, modifier/supprimer ses propres visites.</summary>
    Simple,

    /// <summary>Peut en plus modifier/supprimer n'importe quel restaurant, modérer les visites de
    /// n'importe qui, et changer le rôle des autres utilisateurs.</summary>
    Admin,
}
