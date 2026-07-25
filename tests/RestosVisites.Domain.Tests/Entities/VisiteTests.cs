using RestosVisites.Domain.Entities;
using RestosVisites.Domain.ValueObjects;

namespace RestosVisites.Domain.Tests.Entities;

public class VisiteTests
{
    private static readonly Guid RestaurantIdValide = Guid.NewGuid();
    private static readonly DateOnly DateValide = new(2026, 1, 15);

    [Fact]
    public void Constructeur_ValeursValides_CreeLaVisite()
    {
        var visite = new Visite(RestaurantIdValide, DateValide, new Note(4), "Très bon accueil");

        Assert.NotEqual(Guid.Empty, visite.Id);
        Assert.Equal(RestaurantIdValide, visite.RestaurantId);
        Assert.Equal(DateValide, visite.Date);
        Assert.Equal(4, visite.Note.Valeur);
        Assert.Equal("Très bon accueil", visite.Commentaire);
        Assert.Empty(visite.Photos);
        Assert.Empty(visite.Categories);
    }

    [Fact]
    public void Constructeur_RestaurantIdVide_LeveArgumentException()
    {
        Assert.Throws<ArgumentException>(() => new Visite(Guid.Empty, DateValide, new Note(3)));
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void Constructeur_CommentaireVideOuBlanc_EstNormaliseANull(string? commentaire)
    {
        var visite = new Visite(RestaurantIdValide, DateValide, new Note(3), commentaire);

        Assert.Null(visite.Commentaire);
    }

    [Fact]
    public void Constructeur_CommentaireAvecEspaces_EstTrim()
    {
        var visite = new Visite(RestaurantIdValide, DateValide, new Note(3), "  Sympa  ");

        Assert.Equal("Sympa", visite.Commentaire);
    }

    [Fact]
    public void AjouterPhoto_MemePhotoDeuxFois_NAjoutePasDeDoublon()
    {
        var visite = new Visite(RestaurantIdValide, DateValide, new Note(3));
        var photo = new Photo("https://exemple.test/photo.jpg");

        visite.AjouterPhoto(photo);
        visite.AjouterPhoto(photo);

        Assert.Single(visite.Photos);
    }

    [Fact]
    public void AjouterPhoto_PhotosDifferentes_AjouteLesDeux()
    {
        var visite = new Visite(RestaurantIdValide, DateValide, new Note(3));

        visite.AjouterPhoto(new Photo("https://exemple.test/photo1.jpg"));
        visite.AjouterPhoto(new Photo("https://exemple.test/photo2.jpg"));

        Assert.Equal(2, visite.Photos.Count);
    }

    [Fact]
    public void AjouterCategorie_MemeCategorieDeuxFois_NAjoutePasDeDoublon()
    {
        var visite = new Visite(RestaurantIdValide, DateValide, new Note(3));
        var categorie = new Categorie("Italien");

        visite.AjouterCategorie(categorie);
        visite.AjouterCategorie(categorie);

        Assert.Single(visite.Categories);
    }

    [Fact]
    public void AjouterCategorie_CategoriesDifferentes_AjouteLesDeux()
    {
        var visite = new Visite(RestaurantIdValide, DateValide, new Note(3));

        visite.AjouterCategorie(new Categorie("Italien"));
        visite.AjouterCategorie(new Categorie("Terrasse"));

        Assert.Equal(2, visite.Categories.Count);
    }
}
