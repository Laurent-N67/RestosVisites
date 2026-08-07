namespace RestosVisites.Domain.Enums;

/// <summary>
/// Si une réservation avait été faite pour la visite.
/// </summary>
public enum Reservation
{
    /// <summary>Sans importance / non précisé.</summary>
    Indifferent,

    /// <summary>Une réservation avait été faite.</summary>
    Oui,

    /// <summary>Aucune réservation n'avait été faite.</summary>
    Non,
}
