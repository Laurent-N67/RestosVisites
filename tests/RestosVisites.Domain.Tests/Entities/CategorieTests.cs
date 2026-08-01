using RestosVisites.Domain.Entities;

namespace RestosVisites.Domain.Tests.Entities;

public class CategorieTests
{
    [Fact]
    public void Constructeur_NomEtGroupeValides_CreeLaCategorie()
    {
        var categorie = new Categorie("Italienne", "Type de cuisine");

        Assert.NotEqual(Guid.Empty, categorie.Id);
        Assert.Equal("Italienne", categorie.Nom);
        Assert.Equal("Type de cuisine", categorie.Groupe);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void Constructeur_NomVideOuBlanc_LeveArgumentException(string? nom)
    {
        Assert.Throws<ArgumentException>(() => new Categorie(nom!, "Type de cuisine"));
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void Constructeur_GroupeVideOuBlanc_LeveArgumentException(string? groupe)
    {
        Assert.Throws<ArgumentException>(() => new Categorie("Italienne", groupe!));
    }
}
