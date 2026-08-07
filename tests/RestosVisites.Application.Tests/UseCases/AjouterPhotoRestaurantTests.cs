using RestosVisites.Application.Exceptions;
using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.AjouterPhotoRestaurant;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.Tests.UseCases;

public class AjouterPhotoRestaurantTests
{
    [Fact]
    public async Task ExecuterAsync_CasNominal_AjouteLaPhotoEtRetourneSonId()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);
        await restaurantRepository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);
        var useCase = new AjouterPhotoRestaurant(restaurantRepository);
        var request = new AjouterPhotoRestaurantRequest(restaurant.Id, "https://exemple.test/photo.jpg");

        var response = await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        Assert.NotEqual(Guid.Empty, response.PhotoId);
        var photo = Assert.Single(restaurant.Photos);
        Assert.Equal(response.PhotoId, photo.Id);
        Assert.Equal("https://exemple.test/photo.jpg", photo.Url);
    }

    [Fact]
    public async Task ExecuterAsync_RestaurantInexistant_LeveErreurApplicationExceptionRessourceNonTrouvee()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var useCase = new AjouterPhotoRestaurant(restaurantRepository);
        var request = new AjouterPhotoRestaurantRequest(Guid.NewGuid(), "https://exemple.test/photo.jpg");

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(
            () => useCase.ExecuterAsync(request, TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RessourceNonTrouvee, exception.Type);
    }
}
