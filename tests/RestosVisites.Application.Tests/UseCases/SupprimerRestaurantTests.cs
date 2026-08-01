using RestosVisites.Application.Exceptions;
using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.SupprimerRestaurant;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.Tests.UseCases;

public class SupprimerRestaurantTests
{
    [Fact]
    public async Task ExecuterAsync_CasNominal_SupprimeLeRestaurant()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);
        await restaurantRepository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);
        var useCase = new SupprimerRestaurant(restaurantRepository);
        var request = new SupprimerRestaurantRequest(restaurant.Id);

        await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        Assert.Empty(restaurantRepository.Restaurants);
    }

    [Fact]
    public async Task ExecuterAsync_RestaurantInexistant_LeveErreurApplicationExceptionRessourceNonTrouvee()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var useCase = new SupprimerRestaurant(restaurantRepository);
        var request = new SupprimerRestaurantRequest(Guid.NewGuid());

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(
            () => useCase.ExecuterAsync(request, TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RessourceNonTrouvee, exception.Type);
    }
}
