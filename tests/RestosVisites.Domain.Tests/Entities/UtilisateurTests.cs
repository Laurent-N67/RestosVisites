using RestosVisites.Domain.Entities;
using RestosVisites.Domain.Enums;

namespace RestosVisites.Domain.Tests.Entities;

public class UtilisateurTests
{
    private const string EmailValide = "personne@exemple.test";
    private const string NomAfficheValide = "Personne Exemple";
    private const string HashValide = "hash-pbkdf2";
    private const string SelValide = "sel-aleatoire";
    private const int IterationsValides = 600_000;

    [Fact]
    public void Constructeur_ValeursValides_CreeLUtilisateur()
    {
        var utilisateur = new Utilisateur(
            EmailValide, NomAfficheValide, HashValide, SelValide, IterationsValides, RoleUtilisateur.Simple);

        Assert.NotEqual(Guid.Empty, utilisateur.Id);
        Assert.Equal(EmailValide, utilisateur.Email);
        Assert.Equal(NomAfficheValide, utilisateur.NomAffiche);
        Assert.Equal(HashValide, utilisateur.MotDePasseHash);
        Assert.Equal(SelValide, utilisateur.MotDePasseSel);
        Assert.Equal(IterationsValides, utilisateur.MotDePasseIterations);
        Assert.Equal(RoleUtilisateur.Simple, utilisateur.Role);
    }

    [Fact]
    public void Constructeur_Email_EstNormaliseEnMinusculesEtTrim()
    {
        var utilisateur = new Utilisateur(
            "  Personne@Exemple.Test  ", NomAfficheValide, HashValide, SelValide, IterationsValides, RoleUtilisateur.Simple);

        Assert.Equal("personne@exemple.test", utilisateur.Email);
    }

    [Fact]
    public void Constructeur_NomAfficheAvecEspaces_EstTrim()
    {
        var utilisateur = new Utilisateur(
            EmailValide, "  Personne Exemple  ", HashValide, SelValide, IterationsValides, RoleUtilisateur.Simple);

        Assert.Equal("Personne Exemple", utilisateur.NomAffiche);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    [InlineData("sans-arobase")]
    public void Constructeur_EmailInvalide_LeveArgumentException(string? email)
    {
        Assert.Throws<ArgumentException>(() =>
            new Utilisateur(email!, NomAfficheValide, HashValide, SelValide, IterationsValides, RoleUtilisateur.Simple));
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void Constructeur_NomAfficheVideOuBlanc_LeveArgumentException(string? nomAffiche)
    {
        Assert.Throws<ArgumentException>(() =>
            new Utilisateur(EmailValide, nomAffiche!, HashValide, SelValide, IterationsValides, RoleUtilisateur.Simple));
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void Constructeur_HashVideOuBlanc_LeveArgumentException(string? hash)
    {
        Assert.Throws<ArgumentException>(() =>
            new Utilisateur(EmailValide, NomAfficheValide, hash!, SelValide, IterationsValides, RoleUtilisateur.Simple));
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void Constructeur_SelVideOuBlanc_LeveArgumentException(string? sel)
    {
        Assert.Throws<ArgumentException>(() =>
            new Utilisateur(EmailValide, NomAfficheValide, HashValide, sel!, IterationsValides, RoleUtilisateur.Simple));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Constructeur_IterationsNonPositives_LeveArgumentOutOfRangeException(int iterations)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            new Utilisateur(EmailValide, NomAfficheValide, HashValide, SelValide, iterations, RoleUtilisateur.Simple));
    }

    [Fact]
    public void ChangerRole_NouveauRole_MetAJourLeRole()
    {
        var utilisateur = new Utilisateur(
            EmailValide, NomAfficheValide, HashValide, SelValide, IterationsValides, RoleUtilisateur.Simple);

        utilisateur.ChangerRole(RoleUtilisateur.Admin);

        Assert.Equal(RoleUtilisateur.Admin, utilisateur.Role);
    }
}
