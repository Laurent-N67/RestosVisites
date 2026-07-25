using RestosVisites.Application.Exceptions;
using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.ListerVisitesRestaurant;
using RestosVisites.Domain.Entities;
using RestosVisites.Domain.ValueObjects;

namespace RestosVisites.Application.Tests.UseCases;

public class ListerVisitesRestaurantTests
{
    [Fact]
    public async Task ExecuterAsync_CasNominal_RetourneLesVisitesDuBonRestaurant()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);
        var autreRestaurant = new Restaurant("Autre Restaurant", "2 rue de la Paix", 48.8566, 2.3522);
        await restaurantRepository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);
        await restaurantRepository.AjouterAsync(autreRestaurant, TestContext.Current.CancellationToken);

        var visiteRepository = new FakeVisiteRepository();
        var visite = new Visite(restaurant.Id, new DateOnly(2026, 1, 15), new Note(4), "Sympa");
        var visiteAutreRestaurant = new Visite(autreRestaurant.Id, new DateOnly(2026, 2, 1), new Note(3));
        await visiteRepository.AjouterAsync(visite, TestContext.Current.CancellationToken);
        await visiteRepository.AjouterAsync(visiteAutreRestaurant, TestContext.Current.CancellationToken);

        var useCase = new ListerVisitesRestaurant(restaurantRepository, visiteRepository);

        var resultat = await useCase.ExecuterAsync(restaurant.Id, TestContext.Current.CancellationToken);

        var dto = Assert.Single(resultat);
        Assert.Equal(visite.Id, dto.Id);
        Assert.Equal(restaurant.Id, dto.RestaurantId);
        Assert.Equal(4, dto.Note);
        Assert.Equal("Sympa", dto.Commentaire);
    }

    [Fact]
    public async Task ExecuterAsync_RestaurantInexistant_LeveErreurApplicationExceptionRessourceNonTrouvee()
    {
        var restaurantRepository = new FakeRestaurantRepository();
        var visiteRepository = new FakeVisiteRepository();
        var useCase = new ListerVisitesRestaurant(restaurantRepository, visiteRepository);

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(
            () => useCase.ExecuterAsync(Guid.NewGuid(), TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RessourceNonTrouvee, exception.Type);
    }
}
