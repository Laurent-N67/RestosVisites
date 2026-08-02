using RestosVisites.Domain.Entities;

namespace RestosVisites.Domain.Tests.Entities;

public class FavoriRestaurantTests
{
    private static readonly Guid UtilisateurIdValide = Guid.NewGuid();
    private static readonly Guid RestaurantIdValide = Guid.NewGuid();
    private static readonly DateTimeOffset DateAjoutValide = new(2026, 1, 15, 10, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Constructeur_ValeursValides_CreeLeFavori()
    {
        var favori = new FavoriRestaurant(UtilisateurIdValide, RestaurantIdValide, DateAjoutValide);

        Assert.NotEqual(Guid.Empty, favori.Id);
        Assert.Equal(UtilisateurIdValide, favori.UtilisateurId);
        Assert.Equal(RestaurantIdValide, favori.RestaurantId);
        Assert.Equal(DateAjoutValide, favori.DateAjout);
    }

    [Fact]
    public void Constructeur_UtilisateurIdVide_LeveArgumentException()
    {
        Assert.Throws<ArgumentException>(() => new FavoriRestaurant(Guid.Empty, RestaurantIdValide, DateAjoutValide));
    }

    [Fact]
    public void Constructeur_RestaurantIdVide_LeveArgumentException()
    {
        Assert.Throws<ArgumentException>(() => new FavoriRestaurant(UtilisateurIdValide, Guid.Empty, DateAjoutValide));
    }
}
