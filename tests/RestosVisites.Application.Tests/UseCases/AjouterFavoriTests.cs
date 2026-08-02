using RestosVisites.Application.Exceptions;
using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.AjouterFavori;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.Tests.UseCases;

public class AjouterFavoriTests
{
    private static async Task<(FakeRestaurantRepository RestaurantRepository, Guid RestaurantId)> CreerRestaurantExistantAsync()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);
        await restaurantRepository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);
        return (restaurantRepository, restaurant.Id);
    }

    [Fact]
    public async Task ExecuterAsync_RestaurantExistant_AjouteLeFavori()
    {
        var (restaurantRepository, restaurantId) = await CreerRestaurantExistantAsync();
        var favoriRepository = new FakeFavoriRestaurantRepository();
        var useCase = new AjouterFavori(favoriRepository, restaurantRepository);
        var utilisateurId = Guid.NewGuid();

        await useCase.ExecuterAsync(
            new AjouterFavoriRequest(utilisateurId, restaurantId), TestContext.Current.CancellationToken);

        var favori = Assert.Single(favoriRepository.Favoris);
        Assert.Equal(utilisateurId, favori.UtilisateurId);
        Assert.Equal(restaurantId, favori.RestaurantId);
    }

    [Fact]
    public async Task ExecuterAsync_DejaFavori_EstIdempotent()
    {
        var (restaurantRepository, restaurantId) = await CreerRestaurantExistantAsync();
        var favoriRepository = new FakeFavoriRestaurantRepository();
        var useCase = new AjouterFavori(favoriRepository, restaurantRepository);
        var utilisateurId = Guid.NewGuid();
        var request = new AjouterFavoriRequest(utilisateurId, restaurantId);

        await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);
        await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        Assert.Single(favoriRepository.Favoris);
    }

    [Fact]
    public async Task ExecuterAsync_RestaurantInexistant_LeveErreurApplicationExceptionRessourceNonTrouvee()
    {
        var favoriRepository = new FakeFavoriRestaurantRepository();
        var useCase = new AjouterFavori(favoriRepository, new FakeRestaurantRepository());

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(() => useCase.ExecuterAsync(
            new AjouterFavoriRequest(Guid.NewGuid(), Guid.NewGuid()), TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RessourceNonTrouvee, exception.Type);
    }

    [Fact]
    public async Task ExecuterAsync_DejaSixFavoris_LeveErreurApplicationExceptionRegleMetierViolee()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var favoriRepository = new FakeFavoriRestaurantRepository();
        var utilisateurId = Guid.NewGuid();
        var useCase = new AjouterFavori(favoriRepository, restaurantRepository);

        for (var i = 0; i < 6; i++)
        {
            var restaurant = new Restaurant($"Restaurant {i}", $"{i} rue Test", 45.0, 4.0);
            await restaurantRepository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);
            await useCase.ExecuterAsync(
                new AjouterFavoriRequest(utilisateurId, restaurant.Id), TestContext.Current.CancellationToken);
        }

        var septiemeRestaurant = new Restaurant("Restaurant 7", "7 rue Test", 45.0, 4.0);
        await restaurantRepository.AjouterAsync(septiemeRestaurant, TestContext.Current.CancellationToken);

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(() => useCase.ExecuterAsync(
            new AjouterFavoriRequest(utilisateurId, septiemeRestaurant.Id), TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RegleMetierViolee, exception.Type);
        Assert.Equal(6, favoriRepository.Favoris.Count);
    }
}
