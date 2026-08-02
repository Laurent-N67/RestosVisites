using RestosVisites.Application.Abstractions;

namespace RestosVisites.Application.Tests.Fakes;

/// <summary>
/// Fake déterministe (non sécurisé, réservé aux tests) de <see cref="IMotDePasseHasher"/> : évite
/// de dépendre du hachage PBKDF2 réel (coûteux en CPU par conception) dans les tests Application,
/// qui sont couverts séparément par <c>Pbkdf2MotDePasseHasherTests</c> côté Infrastructure.
/// </summary>
public sealed class FakeMotDePasseHasher : IMotDePasseHasher
{
    private const string SelFixe = "sel-de-test";
    private const int IterationsFixes = 1;

    public ResultatHachageMotDePasse Hacher(string motDePasseEnClair)
    {
        return new ResultatHachageMotDePasse($"hash:{motDePasseEnClair}", SelFixe, IterationsFixes);
    }

    public bool Verifier(string motDePasseEnClair, string hash, string sel, int iterations)
    {
        return hash == $"hash:{motDePasseEnClair}";
    }
}
