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
}
