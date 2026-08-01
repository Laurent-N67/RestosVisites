using RestosVisites.Application.Exceptions;
using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.EnregistrerVisite;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.Tests.UseCases;

public class EnregistrerVisiteTests
{
    private static async Task<(FakeRestaurantRepository RestaurantRepository, Guid RestaurantId)> CreerRestaurantExistantAsync()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);
        await restaurantRepository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);
        return (restaurantRepository, restaurant.Id);
    }

    [Fact]
    public async Task ExecuterAsync_CasNominal_PersisteLaVisiteEtRetourneUnId()
    {
        var (restaurantRepository, restaurantId) = await CreerRestaurantExistantAsync();
        var visiteRepository = new FakeVisiteRepository();
        var useCase = new EnregistrerVisite(restaurantRepository, visiteRepository);
        var request = new EnregistrerVisiteRequest(
            restaurantId,
            new DateOnly(2026, 1, 15),
            4,
            "Très bon accueil",
            ["https://exemple.test/photo.jpg"]);

        var response = await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        Assert.NotEqual(Guid.Empty, response.Id);
        Assert.Single(visiteRepository.Visites);
        Assert.Equal(response.Id, visiteRepository.Visites[0].Id);
    }

    [Fact]
    public async Task ExecuterAsync_RestaurantInexistant_LeveErreurApplicationExceptionRessourceNonTrouvee()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var visiteRepository = new FakeVisiteRepository();
        var useCase = new EnregistrerVisite(restaurantRepository, visiteRepository);
        var request = new EnregistrerVisiteRequest(
            Guid.NewGuid(),
            new DateOnly(2026, 1, 15),
            4,
            null,
            []);

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(
            () => useCase.ExecuterAsync(request, TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RessourceNonTrouvee, exception.Type);
        Assert.Empty(visiteRepository.Visites);
    }

    [Fact]
    public async Task ExecuterAsync_PlusieursPhotos_SontToutesAssocieesALaVisite()
    {
        var (restaurantRepository, restaurantId) = await CreerRestaurantExistantAsync();
        var visiteRepository = new FakeVisiteRepository();
        var useCase = new EnregistrerVisite(restaurantRepository, visiteRepository);
        var request = new EnregistrerVisiteRequest(
            restaurantId,
            new DateOnly(2026, 1, 15),
            4,
            null,
            ["https://exemple.test/photo1.jpg", "https://exemple.test/photo2.jpg"]);

        await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        var visite = Assert.Single(visiteRepository.Visites);
        Assert.Equal(2, visite.Photos.Count);
        Assert.Contains(visite.Photos, p => p.Url == "https://exemple.test/photo1.jpg");
        Assert.Contains(visite.Photos, p => p.Url == "https://exemple.test/photo2.jpg");
    }
}
