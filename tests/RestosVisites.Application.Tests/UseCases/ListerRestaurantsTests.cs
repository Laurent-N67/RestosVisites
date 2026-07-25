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
}
