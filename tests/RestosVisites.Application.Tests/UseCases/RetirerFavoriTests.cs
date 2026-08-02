using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.RetirerFavori;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.Tests.UseCases;

public class RetirerFavoriTests
{
    [Fact]
    public async Task ExecuterAsync_FavoriExistant_LeRetire()
    {
        var favoriRepository = new FakeFavoriRestaurantRepository();
        var utilisateurId = Guid.NewGuid();
        var restaurantId = Guid.NewGuid();
        await favoriRepository.AjouterAsync(
            new FavoriRestaurant(utilisateurId, restaurantId, DateTimeOffset.UtcNow), TestContext.Current.CancellationToken);
        var useCase = new RetirerFavori(favoriRepository);

        await useCase.ExecuterAsync(
            new RetirerFavoriRequest(utilisateurId, restaurantId), TestContext.Current.CancellationToken);

        Assert.Empty(favoriRepository.Favoris);
    }

    [Fact]
    public async Task ExecuterAsync_FavoriInexistant_EstIdempotent()
    {
        var favoriRepository = new FakeFavoriRestaurantRepository();
        var useCase = new RetirerFavori(favoriRepository);

        await useCase.ExecuterAsync(
            new RetirerFavoriRequest(Guid.NewGuid(), Guid.NewGuid()), TestContext.Current.CancellationToken);

        Assert.Empty(favoriRepository.Favoris);
    }
}
