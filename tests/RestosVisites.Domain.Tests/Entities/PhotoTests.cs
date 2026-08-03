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

    [Fact]
    public void Remplacer_NouvelleUrlValide_ChangeLUrl()
    {
        var photo = new Photo("/uploads/ancien.jpg");
        var idOrigine = photo.Id;

        photo.Remplacer("/uploads/nouveau.webp");

        Assert.Equal("/uploads/nouveau.webp", photo.Url);
        // L'identifiant ne change jamais lors d'un remplacement d'URL.
        Assert.Equal(idOrigine, photo.Id);
    }

    [Fact]
    public void Remplacer_NouvelleUrlAvecEspaces_EstNettoyee()
    {
        var photo = new Photo("/uploads/ancien.jpg");

        photo.Remplacer("  /uploads/nouveau.webp  ");

        Assert.Equal("/uploads/nouveau.webp", photo.Url);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void Remplacer_UrlVideOuBlanche_LeveArgumentException(string? nouvelleUrl)
    {
        var photo = new Photo("/uploads/ancien.jpg");

        Assert.Throws<ArgumentException>(() => photo.Remplacer(nouvelleUrl!));
    }
}
