using System.Security.Cryptography;
using RestosVisites.Application.Abstractions;

namespace RestosVisites.Infrastructure.Security;

/// <summary>
/// Hachage à sens unique des mots de passe via PBKDF2-HMACSHA256
/// (<see cref="Rfc2898DeriveBytes.Pbkdf2(string, byte[], int, HashAlgorithmName, int)"/>, déjà
/// inclus dans .NET, aucune dépendance externe). 600 000 itérations : recommandation de l'OWASP
/// Password Storage Cheat Sheet pour PBKDF2-HMAC-SHA256 au moment de l'implémentation de cette
/// classe (2026) — à revoir périodiquement, le nombre recommandé augmentant avec la puissance de
/// calcul disponible pour les attaques par force brute. Sel aléatoire de 16 octets par utilisateur
/// (recommandation NIST/OWASP : minimum 16 octets), comparaison en temps constant à la vérification
/// pour ne pas exposer d'attaque temporelle.
/// </summary>
public sealed class Pbkdf2MotDePasseHasher : IMotDePasseHasher
{
    private const int TailleSelOctets = 16;
    private const int TailleHashOctets = 32;
    private const int IterationsParDefaut = 600_000;

    public ResultatHachageMotDePasse Hacher(string motDePasseEnClair)
    {
        var sel = RandomNumberGenerator.GetBytes(TailleSelOctets);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            motDePasseEnClair, sel, IterationsParDefaut, HashAlgorithmName.SHA256, TailleHashOctets);

        return new ResultatHachageMotDePasse(
            Convert.ToBase64String(hash),
            Convert.ToBase64String(sel),
            IterationsParDefaut);
    }

    public bool Verifier(string motDePasseEnClair, string hash, string sel, int iterations)
    {
        var selOctets = Convert.FromBase64String(sel);
        var hashAttendu = Convert.FromBase64String(hash);

        var hashCalcule = Rfc2898DeriveBytes.Pbkdf2(
            motDePasseEnClair, selOctets, iterations, HashAlgorithmName.SHA256, hashAttendu.Length);

        return CryptographicOperations.FixedTimeEquals(hashCalcule, hashAttendu);
    }
}
