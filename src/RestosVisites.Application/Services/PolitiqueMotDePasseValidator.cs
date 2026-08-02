using RestosVisites.Application.Exceptions;

namespace RestosVisites.Application.Services;

/// <summary>
/// Valide la politique de complexité d'un mot de passe EN CLAIR (avant hachage) : minimum 12
/// caractères, au moins une majuscule, un chiffre et un caractère spécial. Règle non négociable
/// côté utilisateur, partagée entre les cas d'usage qui définissent un mot de passe (inscription,
/// réinitialisation par un Admin, etc.), donc vérifiée ici plutôt que dans le Domain (qui ne voit
/// jamais le mot de passe en clair).
/// </summary>
public static class PolitiqueMotDePasseValidator
{
    private const int LongueurMinimale = 12;

    public static void Valider(string? motDePasse)
    {
        var motDePasseEffectif = motDePasse ?? string.Empty;
        var violations = new List<string>();

        if (motDePasseEffectif.Length < LongueurMinimale)
        {
            violations.Add($"au moins {LongueurMinimale} caractères");
        }

        if (!motDePasseEffectif.Any(char.IsUpper))
        {
            violations.Add("au moins une majuscule");
        }

        if (!motDePasseEffectif.Any(char.IsDigit))
        {
            violations.Add("au moins un chiffre");
        }

        if (!motDePasseEffectif.Any(c => !char.IsLetterOrDigit(c)))
        {
            violations.Add("au moins un caractère spécial");
        }

        if (violations.Count > 0)
        {
            throw new ErreurApplicationException(
                TypeErreurApplication.RegleMetierViolee,
                $"Le mot de passe ne respecte pas les règles suivantes : {string.Join(", ", violations)}.");
        }
    }
}
