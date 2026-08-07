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
        var categorieRepository = new FakeCategorieRepository();
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);
        await restaurantRepository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);
        var useCase = new ModifierRestaurant(restaurantRepository, categorieRepository);
        var request = new ModifierRestaurantRequest(restaurant.Id, "Nouveau Nom", "2 rue Neuve", 45.0, 5.0, []);

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
        var categorieRepository = new FakeCategorieRepository();
        var useCase = new ModifierRestaurant(restaurantRepository, categorieRepository);
        var request = new ModifierRestaurantRequest(Guid.NewGuid(), "Nom", "Adresse", 0, 0, []);

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(
            () => useCase.ExecuterAsync(request, TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RessourceNonTrouvee, exception.Type);
    }

    [Fact]
    public async Task ExecuterAsync_NomEtAdresseEnDoublonAvecAutreRestaurant_LeveErreurApplicationExceptionConflitDeDonnees()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var categorieRepository = new FakeCategorieRepository();
        var autreRestaurant = new Restaurant("Autre Restaurant", "3 rue Ailleurs", 0, 0);
        await restaurantRepository.AjouterAsync(autreRestaurant, TestContext.Current.CancellationToken);
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);
        await restaurantRepository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);
        var useCase = new ModifierRestaurant(restaurantRepository, categorieRepository);
        var request = new ModifierRestaurantRequest(restaurant.Id, "Autre Restaurant", "3 rue Ailleurs", 0, 0, []);

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(
            () => useCase.ExecuterAsync(request, TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.ConflitDeDonnees, exception.Type);
        Assert.Equal("Le Bon Restaurant", restaurant.Nom);
    }

    [Fact]
    public async Task ExecuterAsync_MemeNomEtAdresseQueLuiMeme_NeLevePasDErreur()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var categorieRepository = new FakeCategorieRepository();
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);
        await restaurantRepository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);
        var useCase = new ModifierRestaurant(restaurantRepository, categorieRepository);
        var request = new ModifierRestaurantRequest(restaurant.Id, "Le Bon Restaurant", "1 rue de la Paix", 45.0, 5.0, []);

        await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        Assert.Equal(45.0, restaurant.Latitude);
        Assert.Equal(5.0, restaurant.Longitude);
    }

    [Fact]
    public async Task ExecuterAsync_AvecCategorieIdsValides_RemplaceLesCategories()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var categorieRepository = new FakeCategorieRepository();
        var categorieInitiale = new Categorie("Italienne", "Type de cuisine");
        var nouvelleCategorie = new Categorie("Terrasse", "Autres caractéristiques");
        categorieRepository.Ajouter(categorieInitiale);
        categorieRepository.Ajouter(nouvelleCategorie);
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522, [categorieInitiale]);
        await restaurantRepository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);
        var useCase = new ModifierRestaurant(restaurantRepository, categorieRepository);
        var request = new ModifierRestaurantRequest(
            restaurant.Id, restaurant.Nom, restaurant.Adresse, restaurant.Latitude, restaurant.Longitude, [nouvelleCategorie.Id]);

        await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        Assert.Equal(nouvelleCategorie.Id, Assert.Single(restaurant.Categories).Id);
    }

    [Fact]
    public async Task ExecuterAsync_AvecCategorieIdInexistant_LeveErreurApplicationExceptionRessourceNonTrouvee()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var categorieRepository = new FakeCategorieRepository();
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);
        await restaurantRepository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);
        var useCase = new ModifierRestaurant(restaurantRepository, categorieRepository);
        var request = new ModifierRestaurantRequest(
            restaurant.Id, restaurant.Nom, restaurant.Adresse, restaurant.Latitude, restaurant.Longitude, [Guid.NewGuid()]);

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(
            () => useCase.ExecuterAsync(request, TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RessourceNonTrouvee, exception.Type);
        Assert.Empty(restaurant.Categories);
    }

    [Fact]
    public async Task ExecuterAsync_AvecChampsOptionnelsRenseignes_LesMetAJour()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var categorieRepository = new FakeCategorieRepository();
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);
        await restaurantRepository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);
        var useCase = new ModifierRestaurant(restaurantRepository, categorieRepository);
        var request = new ModifierRestaurantRequest(
            restaurant.Id, "Nouveau Nom", "2 rue Neuve", 45.0, 5.0, [],
            Description: "Description", Telephone: "0102030405", SiteWeb: "https://exemple.test", Horaires: "9h-18h");

        await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        Assert.Equal("Description", restaurant.Description);
        Assert.Equal("0102030405", restaurant.Telephone);
        Assert.Equal("https://exemple.test", restaurant.SiteWeb);
        Assert.Equal("9h-18h", restaurant.Horaires);
    }
}
