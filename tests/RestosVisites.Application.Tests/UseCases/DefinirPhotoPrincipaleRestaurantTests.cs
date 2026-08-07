using RestosVisites.Application.Exceptions;
using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.DefinirPhotoPrincipaleRestaurant;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.Tests.UseCases;

public class DefinirPhotoPrincipaleRestaurantTests
{
    [Fact]
    public async Task ExecuterAsync_CasNominal_MarqueLaPhotoCommePrincipale()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);
        var premierePhoto = restaurant.AjouterPhoto("https://exemple.test/1.jpg");
        var deuxiemePhoto = restaurant.AjouterPhoto("https://exemple.test/2.jpg");
        await restaurantRepository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);
        var useCase = new DefinirPhotoPrincipaleRestaurant(restaurantRepository);
        var request = new DefinirPhotoPrincipaleRestaurantRequest(restaurant.Id, deuxiemePhoto.Id);

        await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        Assert.False(premierePhoto.EstPrincipale);
        Assert.True(deuxiemePhoto.EstPrincipale);
    }

    [Fact]
    public async Task ExecuterAsync_RestaurantInexistant_LeveErreurApplicationExceptionRessourceNonTrouvee()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var useCase = new DefinirPhotoPrincipaleRestaurant(restaurantRepository);
        var request = new DefinirPhotoPrincipaleRestaurantRequest(Guid.NewGuid(), Guid.NewGuid());

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(
            () => useCase.ExecuterAsync(request, TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RessourceNonTrouvee, exception.Type);
    }

    [Fact]
    public async Task ExecuterAsync_PhotoInexistante_LeveErreurApplicationExceptionRessourceNonTrouvee()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);
        await restaurantRepository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);
        var useCase = new DefinirPhotoPrincipaleRestaurant(restaurantRepository);
        var request = new DefinirPhotoPrincipaleRestaurantRequest(restaurant.Id, Guid.NewGuid());

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(
            () => useCase.ExecuterAsync(request, TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RessourceNonTrouvee, exception.Type);
    }
}
