using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.ListerRestaurants;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.Tests.UseCases;

public class ListerRestaurantsTests
{
    [Fact]
    public async Task ExecuterAsync_ListeVide_RetourneUneListeVide()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var useCase = new ListerRestaurants(restaurantRepository);

        var resultat = await useCase.ExecuterAsync(TestContext.Current.CancellationToken);

        Assert.Empty(resultat);
    }

    [Fact]
    public async Task ExecuterAsync_PlusieursRestaurants_RetourneLaListeAttendue()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var restaurant1 = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);
        var restaurant2 = new Restaurant("Autre Restaurant", "2 rue de la Paix", 45.75, 4.85);
        await restaurantRepository.AjouterAsync(restaurant1, TestContext.Current.CancellationToken);
        await restaurantRepository.AjouterAsync(restaurant2, TestContext.Current.CancellationToken);

        var useCase = new ListerRestaurants(restaurantRepository);

        var resultat = await useCase.ExecuterAsync(TestContext.Current.CancellationToken);

        Assert.Equal(2, resultat.Count);
        Assert.Contains(resultat, r => r.Id == restaurant1.Id && r.Nom == restaurant1.Nom);
        Assert.Contains(resultat, r => r.Id == restaurant2.Id && r.Nom == restaurant2.Nom);
    }

    [Fact]
    public async Task ExecuterAsync_RestaurantAvecCategories_LesInclutDansLeDto()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var categorie = new Categorie("Italienne", "Type de cuisine");
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522, [categorie]);
        await restaurantRepository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);

        var useCase = new ListerRestaurants(restaurantRepository);

        var resultat = await useCase.ExecuterAsync(TestContext.Current.CancellationToken);

        var dto = Assert.Single(resultat);
        var categorieDto = Assert.Single(dto.Categories);
        Assert.Equal(categorie.Id, categorieDto.Id);
        Assert.Equal("Italienne", categorieDto.Nom);
        Assert.Equal("Type de cuisine", categorieDto.Groupe);
    }

    [Fact]
    public async Task ExecuterAsync_RestaurantAvecChampsOptionnelsEtPhotos_LesInclutDansLeDto()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var restaurant = new Restaurant(
            "Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522,
            description: "Une belle table", telephone: "0102030405", siteWeb: "https://exemple.test", horaires: "9h-18h");
        var photo = restaurant.AjouterPhoto("https://exemple.test/photo.jpg");
        restaurant.DefinirPhotoPrincipale(photo.Id);
        await restaurantRepository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);

        var useCase = new ListerRestaurants(restaurantRepository);

        var resultat = await useCase.ExecuterAsync(TestContext.Current.CancellationToken);

        var dto = Assert.Single(resultat);
        Assert.Equal("Une belle table", dto.Description);
        Assert.Equal("0102030405", dto.Telephone);
        Assert.Equal("https://exemple.test", dto.SiteWeb);
        Assert.Equal("9h-18h", dto.Horaires);
        var photoDto = Assert.Single(dto.Photos);
        Assert.Equal(photo.Id, photoDto.Id);
        Assert.Equal("https://exemple.test/photo.jpg", photoDto.Url);
        Assert.True(photoDto.EstPrincipale);
        Assert.Equal(0, photoDto.Ordre);
    }
}
