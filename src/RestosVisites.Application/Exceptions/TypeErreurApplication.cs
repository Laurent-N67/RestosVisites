namespace RestosVisites.Application.Exceptions;

/// <summary>
/// Catégorie d'erreur métier, utilisée par les couches supérieures (ex : Api) pour choisir
/// la réponse appropriée (404, 409, ...) sans avoir à analyser le message d'erreur.
/// </summary>
public enum TypeErreurApplication
{
    /// <summary>La ressource demandée n'existe pas.</summary>
    RessourceNonTrouvee,

    /// <summary>L'opération entre en conflit avec une ressource déjà existante.</summary>
    ConflitDeDonnees,

    /// <summary>L'utilisateur n'est pas authentifié, ou ses identifiants de connexion sont invalides.</summary>
    NonAutorise,

    /// <summary>L'utilisateur est authentifié mais n'a pas le droit d'effectuer cette opération.</summary>
    AccesRefuse,

    /// <summary>L'opération viole une règle métier (ex : mot de passe trop faible, quota dépassé).</summary>
    RegleMetierViolee,
}
