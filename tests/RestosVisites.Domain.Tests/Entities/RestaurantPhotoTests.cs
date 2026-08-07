using RestosVisites.Domain.Entities;

namespace RestosVisites.Domain.Tests.Entities;

public class RestaurantPhotoTests
{
    [Fact]
    public void Constructeur_UrlValide_CreeLaPhoto()
    {
        var photo = new RestaurantPhoto("https://exemple.test/photo.jpg", 0);

        Assert.NotEqual(Guid.Empty, photo.Id);
        Assert.Equal("https://exemple.test/photo.jpg", photo.Url);
        Assert.False(photo.EstPrincipale);
        Assert.Equal(0, photo.Ordre);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void Constructeur_UrlVideOuBlanche_LeveArgumentException(string? url)
    {
        Assert.Throws<ArgumentException>(() => new RestaurantPhoto(url!, 0));
    }
}
