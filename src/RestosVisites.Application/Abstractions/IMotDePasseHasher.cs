namespace RestosVisites.Application.Abstractions;

/// <summary>
/// Port de hachage (à sens unique, jamais réversible) des mots de passe.
/// </summary>
public interface IMotDePasseHasher
{
    /// <summary>Hache un mot de passe en clair avec un sel généré aléatoirement.</summary>
    ResultatHachageMotDePasse Hacher(string motDePasseEnClair);

    /// <summary>Vérifie qu'un mot de passe en clair correspond à un hash déjà calculé, en temps constant.</summary>
    bool Verifier(string motDePasseEnClair, string hash, string sel, int iterations);
}

/// <summary>Résultat du hachage d'un mot de passe : le hash, le sel utilisé, et le nombre d'itérations.</summary>
public sealed record ResultatHachageMotDePasse(string Hash, string Sel, int Iterations);
