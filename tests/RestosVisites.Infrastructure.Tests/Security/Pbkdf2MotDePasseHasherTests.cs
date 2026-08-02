using RestosVisites.Infrastructure.Security;

namespace RestosVisites.Infrastructure.Tests.Security;

public class Pbkdf2MotDePasseHasherTests
{
    private const string MotDePasse = "MotDePasse123!";

    [Fact]
    public void Hacher_MemeMotDePasseDeuxFois_ProduitDesSelsEtDesHashsDifferents()
    {
        var hasher = new Pbkdf2MotDePasseHasher();

        var premierResultat = hasher.Hacher(MotDePasse);
        var secondResultat = hasher.Hacher(MotDePasse);

        Assert.NotEqual(premierResultat.Sel, secondResultat.Sel);
        Assert.NotEqual(premierResultat.Hash, secondResultat.Hash);
    }

    [Fact]
    public void Hacher_NeStockeJamaisLeMotDePasseEnClairDansLeHashOuLeSel()
    {
        var hasher = new Pbkdf2MotDePasseHasher();

        var resultat = hasher.Hacher(MotDePasse);

        Assert.DoesNotContain(MotDePasse, resultat.Hash);
        Assert.DoesNotContain(MotDePasse, resultat.Sel);
    }

    [Fact]
    public void Verifier_MotDePasseCorrect_RetourneTrue()
    {
        var hasher = new Pbkdf2MotDePasseHasher();
        var resultat = hasher.Hacher(MotDePasse);

        var estValide = hasher.Verifier(MotDePasse, resultat.Hash, resultat.Sel, resultat.Iterations);

        Assert.True(estValide);
    }

    [Fact]
    public void Verifier_MotDePasseIncorrect_RetourneFalse()
    {
        var hasher = new Pbkdf2MotDePasseHasher();
        var resultat = hasher.Hacher(MotDePasse);

        var estValide = hasher.Verifier("AutreMotDePasse123!", resultat.Hash, resultat.Sel, resultat.Iterations);

        Assert.False(estValide);
    }

    [Fact]
    public void Hacher_UtiliseUnSelDauMoins16Octets()
    {
        var hasher = new Pbkdf2MotDePasseHasher();

        var resultat = hasher.Hacher(MotDePasse);

        Assert.True(Convert.FromBase64String(resultat.Sel).Length >= 16);
    }
}
