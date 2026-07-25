using RestosVisites.Domain.Entities;

namespace RestosVisites.Domain.Tests.Entities;

public class PhotoTests
{
    [Fact]
    public void Constructeur_UrlValide_CreeLaPhoto()
    {
        var photo = new Photo("https://exemple.test/photo.jpg");

        Assert.NotEqual(Guid.Empty, photo.Id);
        Assert.Equal("https://exemple.test/photo.jpg", photo.Url);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void Constructeur_UrlVideOuBlanche_LeveArgumentException(string? url)
    {
        Assert.Throws<ArgumentException>(() => new Photo(url!));
    }
}
