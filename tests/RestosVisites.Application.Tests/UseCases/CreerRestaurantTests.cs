using RestosVisites.Application.Exceptions;
using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.CreerRestaurant;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.Tests.UseCases;

public class CreerRestaurantTests
{
    [Fact]
    public async Task ExecuterAsync_CasNominal_PersisteEtRetourneUnId()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var categorieRepository = new FakeCategorieRepository();
        var useCase = new CreerRestaurant(restaurantRepository, categorieRepository);
        var request = new CreerRestaurantRequest("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522, []);

        var response = await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        Assert.NotEqual(Guid.Empty, response.Id);
        Assert.Single(restaurantRepository.Restaurants);
        Assert.Equal(response.Id, restaurantRepository.Restaurants[0].Id);
    }

    [Fact]
    public async Task ExecuterAsync_NomEtAdresseEnDoublon_LeveErreurApplicationExceptionConflitDeDonnees()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var categorieRepository = new FakeCategorieRepository();
        var useCase = new CreerRestaurant(restaurantRepository, categorieRepository);
        var request = new CreerRestaurantRequest("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522, []);

        await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(
            () => useCase.ExecuterAsync(request, TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.ConflitDeDonnees, exception.Type);
        Assert.Single(restaurantRepository.Restaurants);
    }

    [Fact]
    public async Task ExecuterAsync_AvecCategorieIdsValides_AssocieLesCategories()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var categorieRepository = new FakeCategorieRepository();
        var categorie = new Categorie("Italienne", "Type de cuisine");
        categorieRepository.Ajouter(categorie);
        var useCase = new CreerRestaurant(restaurantRepository, categorieRepository);
        var request = new CreerRestaurantRequest("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522, [categorie.Id]);

        var response = await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        var restaurantCree = Assert.Single(restaurantRepository.Restaurants, r => r.Id == response.Id);
        Assert.Equal(categorie.Id, Assert.Single(restaurantCree.Categories).Id);
    }

    [Fact]
    public async Task ExecuterAsync_AvecCategorieIdInexistant_LeveErreurApplicationExceptionRessourceNonTrouvee()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var categorieRepository = new FakeCategorieRepository();
        var useCase = new CreerRestaurant(restaurantRepository, categorieRepository);
        var request = new CreerRestaurantRequest("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522, [Guid.NewGuid()]);

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(
            () => useCase.ExecuterAsync(request, TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RessourceNonTrouvee, exception.Type);
        Assert.Empty(restaurantRepository.Restaurants);
    }

    [Fact]
    public async Task ExecuterAsync_AvecChampsOptionnelsRenseignes_LesPersiste()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var categorieRepository = new FakeCategorieRepository();
        var useCase = new CreerRestaurant(restaurantRepository, categorieRepository);
        var request = new CreerRestaurantRequest(
            "Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522, [],
            Description: "Une belle table", Telephone: "0102030405", SiteWeb: "https://exemple.test", Horaires: "9h-18h");

        var response = await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        var restaurantCree = Assert.Single(restaurantRepository.Restaurants, r => r.Id == response.Id);
        Assert.Equal("Une belle table", restaurantCree.Description);
        Assert.Equal("0102030405", restaurantCree.Telephone);
        Assert.Equal("https://exemple.test", restaurantCree.SiteWeb);
        Assert.Equal("9h-18h", restaurantCree.Horaires);
    }
}
