using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.ListerMesFavoris;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.Tests.UseCases;

public class ListerMesFavorisTests
{
    [Fact]
    public async Task ExecuterAsync_AvecFavoris_NeRetourneQueCeuxDeLUtilisateurDemande()
    {
        var favoriRepository = new FakeFavoriRestaurantRepository();
        var utilisateurId = Guid.NewGuid();
        var autreUtilisateurId = Guid.NewGuid();
        var restaurantId = Guid.NewGuid();
        var dateAjout = new DateTimeOffset(2026, 1, 15, 10, 0, 0, TimeSpan.Zero);
        await favoriRepository.AjouterAsync(
            new FavoriRestaurant(utilisateurId, restaurantId, dateAjout), TestContext.Current.CancellationToken);
        await favoriRepository.AjouterAsync(
            new FavoriRestaurant(autreUtilisateurId, Guid.NewGuid(), dateAjout), TestContext.Current.CancellationToken);
        var useCase = new ListerMesFavoris(favoriRepository);

        var resultat = await useCase.ExecuterAsync(
            new ListerMesFavorisRequest(utilisateurId), TestContext.Current.CancellationToken);

        var favori = Assert.Single(resultat);
        Assert.Equal(restaurantId, favori.RestaurantId);
        Assert.Equal(dateAjout, favori.DateAjout);
    }

    [Fact]
    public async Task ExecuterAsync_SansFavoris_RetourneUneListeVide()
    {
        var useCase = new ListerMesFavoris(new FakeFavoriRestaurantRepository());

        var resultat = await useCase.ExecuterAsync(
            new ListerMesFavorisRequest(Guid.NewGuid()), TestContext.Current.CancellationToken);

        Assert.Empty(resultat);
    }
}
