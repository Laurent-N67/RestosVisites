using RestosVisites.Domain.Entities;

namespace RestosVisites.Domain.Tests.Entities;

public class CategorieTests
{
    [Fact]
    public void Constructeur_NomValide_CreeLaCategorie()
    {
        var categorie = new Categorie("Italien");

        Assert.NotEqual(Guid.Empty, categorie.Id);
        Assert.Equal("Italien", categorie.Nom);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void Constructeur_NomVideOuBlanc_LeveArgumentException(string? nom)
    {
        Assert.Throws<ArgumentException>(() => new Categorie(nom!));
    }
}
