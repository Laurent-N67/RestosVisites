using RestosVisites.Application.Exceptions;
using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.SupprimerPhotoRestaurant;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.Tests.UseCases;

public class SupprimerPhotoRestaurantTests
{
    [Fact]
    public async Task ExecuterAsync_CasNominal_SupprimeLaPhoto()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);
        var photo = restaurant.AjouterPhoto("https://exemple.test/photo.jpg");
        await restaurantRepository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);
        var useCase = new SupprimerPhotoRestaurant(restaurantRepository);
        var request = new SupprimerPhotoRestaurantRequest(restaurant.Id, photo.Id);

        await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        Assert.Empty(restaurant.Photos);
    }

    [Fact]
    public async Task ExecuterAsync_RestaurantInexistant_LeveErreurApplicationExceptionRessourceNonTrouvee()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var useCase = new SupprimerPhotoRestaurant(restaurantRepository);
        var request = new SupprimerPhotoRestaurantRequest(Guid.NewGuid(), Guid.NewGuid());

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(
            () => useCase.ExecuterAsync(request, TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RessourceNonTrouvee, exception.Type);
    }
}
