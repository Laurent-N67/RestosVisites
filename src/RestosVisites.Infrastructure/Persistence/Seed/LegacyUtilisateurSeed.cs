using System.Security.Cryptography;
using System.Text;
using RestosVisites.Domain.Enums;

namespace RestosVisites.Infrastructure.Persistence.Seed;

/// <summary>
/// Utilisateur "historique", non-fonctionnel, servant uniquement de propriétaire aux visites déjà
/// en base au moment de l'introduction des comptes utilisateurs (voir la migration
/// AjouterUtilisateursEtProprietaireVisite). Son email n'est pas une adresse réelle et son mot de
/// passe n'est ni connu ni destiné à être vérifié : ce compte ne peut jamais se connecter. Son
/// identifiant est dérivé de façon déterministe (même style que <see cref="CategorieSeedData.IdPour"/>)
/// afin de rester stable entre les exécutions de la migration et réutilisable tel quel dans les tests.
/// </summary>
internal static class LegacyUtilisateurSeed
{
    public static Guid Id { get; } = CalculerId();

    public const string Email = "legacy@restosvisites.local";
    public const string NomAffiche = "Historique (visites importées)";

    // Valeurs fixes, arbitraires : ce compte n'est jamais authentifié, donc "hash"/"sel" n'ont pas
    // besoin d'être calculés à partir d'un vrai mot de passe ni d'être secrets.
    public const string MotDePasseHash = "LEGACY-COMPTE-NON-UTILISABLE-HASH";
    public const string MotDePasseSel = "LEGACY-COMPTE-NON-UTILISABLE-SEL";
    public const int MotDePasseIterations = 600_000;

    public const RoleUtilisateur Role = RoleUtilisateur.Simple;

    private static Guid CalculerId()
    {
        var texte = "RestosVisites.Utilisateur:legacy";
        var hash = MD5.HashData(Encoding.UTF8.GetBytes(texte));
        return new Guid(hash);
    }
}
