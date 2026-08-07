namespace RestosVisites.Domain.Enums;

/// <summary>
/// Avec qui la visite a eu lieu.
/// </summary>
public enum Compagnie
{
    /// <summary>La visite a eu lieu seul.</summary>
    Seul,

    /// <summary>La visite a eu lieu en couple.</summary>
    Couple,

    /// <summary>La visite a eu lieu entre amis.</summary>
    Amis,

    /// <summary>La visite a eu lieu en famille.</summary>
    Famille,
}
