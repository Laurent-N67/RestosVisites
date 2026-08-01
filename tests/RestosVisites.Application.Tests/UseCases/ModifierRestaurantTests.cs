using RestosVisites.Application.Exceptions;
using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.ModifierRestaurant;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.Tests.UseCases;

public class ModifierRestaurantTests
{
    [Fact]
    public async Task ExecuterAsync_CasNominal_MetAJourLeRestaurant()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);
        await restaurantRepository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);
        var useCase = new ModifierRestaurant(restaurantRepository);
        var request = new ModifierRestaurantRequest(restaurant.Id, "Nouveau Nom", "2 rue Neuve", 45.0, 5.0);

        await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        var restaurantModifie = Assert.Single(restaurantRepository.Restaurants);
        Assert.Equal("Nouveau Nom", restaurantModifie.Nom);
        Assert.Equal("2 rue Neuve", restaurantModifie.Adresse);
        Assert.Equal(45.0, restaurantModifie.Latitude);
        Assert.Equal(5.0, restaurantModifie.Longitude);
    }

    [Fact]
    public async Task ExecuterAsync_RestaurantInexistant_LeveErreurApplicationExceptionRessourceNonTrouvee()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var useCase = new ModifierRestaurant(restaurantRepository);
        var request = new ModifierRestaurantRequest(Guid.NewGuid(), "Nom", "Adresse", 0, 0);

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(
            () => useCase.ExecuterAsync(request, TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RessourceNonTrouvee, exception.Type);
    }

    [Fact]
    public async Task ExecuterAsync_NomEtAdresseEnDoublonAvecAutreRestaurant_LeveErreurApplicationExceptionConflitDeDonnees()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var autreRestaurant = new Restaurant("Autre Restaurant", "3 rue Ailleurs", 0, 0);
        await restaurantRepository.AjouterAsync(autreRestaurant, TestContext.Current.CancellationToken);
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);
        await restaurantRepository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);
        var useCase = new ModifierRestaurant(restaurantRepository);
        var request = new ModifierRestaurantRequest(restaurant.Id, "Autre Restaurant", "3 rue Ailleurs", 0, 0);

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(
            () => useCase.ExecuterAsync(request, TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.ConflitDeDonnees, exception.Type);
        Assert.Equal("Le Bon Restaurant", restaurant.Nom);
    }

    [Fact]
    public async Task ExecuterAsync_MemeNomEtAdresseQueLuiMeme_NeLevePasDErreur()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);
        await restaurantRepository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);
        var useCase = new ModifierRestaurant(restaurantRepository);
        var request = new ModifierRestaurantRequest(restaurant.Id, "Le Bon Restaurant", "1 rue de la Paix", 45.0, 5.0);

        await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        Assert.Equal(45.0, restaurant.Latitude);
        Assert.Equal(5.0, restaurant.Longitude);
    }
}
