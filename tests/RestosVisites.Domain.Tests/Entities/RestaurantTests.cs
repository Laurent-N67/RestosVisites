using RestosVisites.Domain.Entities;

namespace RestosVisites.Domain.Tests.Entities;

public class RestaurantTests
{
    [Fact]
    public void Constructeur_ValeursValides_CreeLeRestaurant()
    {
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);

        Assert.NotEqual(Guid.Empty, restaurant.Id);
        Assert.Equal("Le Bon Restaurant", restaurant.Nom);
        Assert.Equal("1 rue de la Paix", restaurant.Adresse);
        Assert.Equal(48.8566, restaurant.Latitude);
        Assert.Equal(2.3522, restaurant.Longitude);
        Assert.Empty(restaurant.Categories);
    }

    [Fact]
    public void Constructeur_AvecCategories_LesAssocie()
    {
        var categorie = new Categorie("Italienne", "Type de cuisine");

        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522, [categorie]);

        Assert.Equal(categorie.Id, Assert.Single(restaurant.Categories).Id);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void Constructeur_NomVideOuBlanc_LeveArgumentException(string? nom)
    {
        Assert.Throws<ArgumentException>(() => new Restaurant(nom!, "1 rue de la Paix", 0, 0));
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void Constructeur_AdresseVideOuBlanche_LeveArgumentException(string? adresse)
    {
        Assert.Throws<ArgumentException>(() => new Restaurant("Le Bon Restaurant", adresse!, 0, 0));
    }

    [Theory]
    [InlineData(-90.1)]
    [InlineData(90.1)]
    public void Constructeur_LatitudeHorsBornes_LeveArgumentOutOfRangeException(double latitude)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new Restaurant("Nom", "Adresse", latitude, 0));
    }

    [Theory]
    [InlineData(-180.1)]
    [InlineData(180.1)]
    public void Constructeur_LongitudeHorsBornes_LeveArgumentOutOfRangeException(double longitude)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new Restaurant("Nom", "Adresse", 0, longitude));
    }

    [Theory]
    [InlineData(-90)]
    [InlineData(90)]
    public void Constructeur_LatitudeAuxBornes_EstAcceptee(double latitude)
    {
        var restaurant = new Restaurant("Nom", "Adresse", latitude, 0);

        Assert.Equal(latitude, restaurant.Latitude);
    }

    [Theory]
    [InlineData(-180)]
    [InlineData(180)]
    public void Constructeur_LongitudeAuxBornes_EstAcceptee(double longitude)
    {
        var restaurant = new Restaurant("Nom", "Adresse", 0, longitude);

        Assert.Equal(longitude, restaurant.Longitude);
    }

    [Fact]
    public void Modifier_ValeursValides_MetAJourLesProprietes()
    {
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);
        var idAvant = restaurant.Id;

        restaurant.Modifier("Nouveau Nom", "2 rue Neuve", 45.0, 5.0);

        Assert.Equal(idAvant, restaurant.Id);
        Assert.Equal("Nouveau Nom", restaurant.Nom);
        Assert.Equal("2 rue Neuve", restaurant.Adresse);
        Assert.Equal(45.0, restaurant.Latitude);
        Assert.Equal(5.0, restaurant.Longitude);
    }

    [Fact]
    public void Modifier_NomEtAdresseAvecEspaces_SontTrim()
    {
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);

        restaurant.Modifier("  Nouveau Nom  ", "  2 rue Neuve  ", 45.0, 5.0);

        Assert.Equal("Nouveau Nom", restaurant.Nom);
        Assert.Equal("2 rue Neuve", restaurant.Adresse);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void Modifier_NomVideOuBlanc_LeveArgumentException(string? nom)
    {
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);

        Assert.Throws<ArgumentException>(() => restaurant.Modifier(nom!, "Adresse", 0, 0));
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void Modifier_AdresseVideOuBlanche_LeveArgumentException(string? adresse)
    {
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);

        Assert.Throws<ArgumentException>(() => restaurant.Modifier("Nom", adresse!, 0, 0));
    }

    [Theory]
    [InlineData(-90.1)]
    [InlineData(90.1)]
    public void Modifier_LatitudeHorsBornes_LeveArgumentOutOfRangeException(double latitude)
    {
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);

        Assert.Throws<ArgumentOutOfRangeException>(() => restaurant.Modifier("Nom", "Adresse", latitude, 0));
    }

    [Theory]
    [InlineData(-180.1)]
    [InlineData(180.1)]
    public void Modifier_LongitudeHorsBornes_LeveArgumentOutOfRangeException(double longitude)
    {
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);

        Assert.Throws<ArgumentOutOfRangeException>(() => restaurant.Modifier("Nom", "Adresse", 0, longitude));
    }

    [Fact]
    public void Modifier_ValeursInvalides_NeModifiePasLesProprietesExistantes()
    {
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);

        Assert.Throws<ArgumentException>(() => restaurant.Modifier("", "Adresse", 0, 0));

        Assert.Equal("Le Bon Restaurant", restaurant.Nom);
        Assert.Equal("1 rue de la Paix", restaurant.Adresse);
        Assert.Equal(48.8566, restaurant.Latitude);
        Assert.Equal(2.3522, restaurant.Longitude);
    }

    [Fact]
    public void DefinirCategories_RemplaceEntierementLEnsembleExistant()
    {
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522, [new Categorie("Italienne", "Type de cuisine")]);
        var nouvelleCategorie = new Categorie("Terrasse", "Autres caractéristiques");

        restaurant.DefinirCategories([nouvelleCategorie]);

        Assert.Equal(nouvelleCategorie.Id, Assert.Single(restaurant.Categories).Id);
    }

    [Fact]
    public void DefinirCategories_AvecDoublons_NeLesAjoutePasDeuxFois()
    {
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);
        var categorie = new Categorie("Italienne", "Type de cuisine");

        restaurant.DefinirCategories([categorie, categorie]);

        Assert.Single(restaurant.Categories);
    }

    [Fact]
    public void DefinirCategories_ListeVide_ViideLEnsemble()
    {
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522, [new Categorie("Italienne", "Type de cuisine")]);

        restaurant.DefinirCategories([]);

        Assert.Empty(restaurant.Categories);
    }
}
