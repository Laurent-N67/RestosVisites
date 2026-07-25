using RestosVisites.Application.Exceptions;
using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.CreerRestaurant;

namespace RestosVisites.Application.Tests.UseCases;

public class CreerRestaurantTests
{
    [Fact]
    public async Task ExecuterAsync_CasNominal_PersisteEtRetourneUnId()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var useCase = new CreerRestaurant(restaurantRepository);
        var request = new CreerRestaurantRequest("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);

        var response = await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        Assert.NotEqual(Guid.Empty, response.Id);
        Assert.Single(restaurantRepository.Restaurants);
        Assert.Equal(response.Id, restaurantRepository.Restaurants[0].Id);
    }

    [Fact]
    public async Task ExecuterAsync_NomEtAdresseEnDoublon_LeveErreurApplicationExceptionConflitDeDonnees()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var useCase = new CreerRestaurant(restaurantRepository);
        var request = new CreerRestaurantRequest("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);

        await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(
            () => useCase.ExecuterAsync(request, TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.ConflitDeDonnees, exception.Type);
        Assert.Single(restaurantRepository.Restaurants);
    }
}
