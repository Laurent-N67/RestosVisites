using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.ListerUtilisateursAvecFavoris;
using RestosVisites.Domain.Entities;
using RestosVisites.Domain.Enums;

namespace RestosVisites.Application.Tests.UseCases;

public class ListerUtilisateursAvecFavorisTests
{
    [Fact]
    public async Task ExecuterAsync_UtilisateurAvecFavoris_RetourneSesFavorisEnrichisDuNomDuRestaurant()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var utilisateur = new Utilisateur("personne@exemple.test", "Personne", "hash", "sel", 600_000, RoleUtilisateur.Simple);
        await utilisateurRepository.AjouterAsync(utilisateur, TestContext.Current.CancellationToken);

        var restaurantRepository = new FakeRestaurantRepository();
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);
        await restaurantRepository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);

        var favoriRepository = new FakeFavoriRestaurantRepository();
        var dateAjout = new DateTimeOffset(2026, 1, 15, 10, 0, 0, TimeSpan.Zero);
        await favoriRepository.AjouterAsync(
            new FavoriRestaurant(utilisateur.Id, restaurant.Id, dateAjout), TestContext.Current.CancellationToken);

        var useCase = new ListerUtilisateursAvecFavoris(utilisateurRepository, favoriRepository, restaurantRepository);
        var request = new ListerUtilisateursAvecFavorisRequest(utilisateur.Id, RoleUtilisateur.Admin);

        var resultat = await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        var utilisateurDto = Assert.Single(resultat);
        Assert.Equal(utilisateur.Id, utilisateurDto.Id);
        var favoriDto = Assert.Single(utilisateurDto.Favoris);
        Assert.Equal(restaurant.Id, favoriDto.RestaurantId);
        Assert.Equal(restaurant.Nom, favoriDto.RestaurantNom);
        Assert.Equal(dateAjout, favoriDto.DateAjout);
    }

    [Fact]
    public async Task ExecuterAsync_UtilisateurSansFavoris_RetourneUneListeDeFavorisVide()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var utilisateur = new Utilisateur("personne@exemple.test", "Personne", "hash", "sel", 600_000, RoleUtilisateur.Simple);
        await utilisateurRepository.AjouterAsync(utilisateur, TestContext.Current.CancellationToken);

        var useCase = new ListerUtilisateursAvecFavoris(
            utilisateurRepository, new FakeFavoriRestaurantRepository(), new FakeRestaurantRepository());
        var request = new ListerUtilisateursAvecFavorisRequest(utilisateur.Id, RoleUtilisateur.Admin);

        var resultat = await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        var utilisateurDto = Assert.Single(resultat);
        Assert.Empty(utilisateurDto.Favoris);
    }

    [Fact]
    public async Task ExecuterAsync_UtilisateurHistorique_EstExcluDuResultat()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var utilisateurReel = new Utilisateur("personne@exemple.test", "Personne", "hash", "sel", 600_000, RoleUtilisateur.Simple);
        var utilisateurHistorique = new Utilisateur("legacy@restosvisites.local", "Historique", "hash", "sel", 600_000, RoleUtilisateur.Simple);
        await utilisateurRepository.AjouterAsync(utilisateurReel, TestContext.Current.CancellationToken);
        await utilisateurRepository.AjouterAsync(utilisateurHistorique, TestContext.Current.CancellationToken);
        utilisateurRepository.IdsUtilisateursHistoriques.Add(utilisateurHistorique.Id);

        var useCase = new ListerUtilisateursAvecFavoris(
            utilisateurRepository, new FakeFavoriRestaurantRepository(), new FakeRestaurantRepository());
        var request = new ListerUtilisateursAvecFavorisRequest(utilisateurReel.Id, RoleUtilisateur.Admin);

        var resultat = await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        var utilisateurDto = Assert.Single(resultat);
        Assert.Equal(utilisateurReel.Id, utilisateurDto.Id);
    }

    [Fact]
    public async Task ExecuterAsync_AppelantAdmin_VoitLesEmailsDeTousLesUtilisateurs()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var admin = new Utilisateur("admin@exemple.test", "Admin", "hash", "sel", 600_000, RoleUtilisateur.Admin);
        var autre = new Utilisateur("autre@exemple.test", "Autre", "hash", "sel", 600_000, RoleUtilisateur.Simple);
        await utilisateurRepository.AjouterAsync(admin, TestContext.Current.CancellationToken);
        await utilisateurRepository.AjouterAsync(autre, TestContext.Current.CancellationToken);

        var useCase = new ListerUtilisateursAvecFavoris(
            utilisateurRepository, new FakeFavoriRestaurantRepository(), new FakeRestaurantRepository());
        var request = new ListerUtilisateursAvecFavorisRequest(admin.Id, RoleUtilisateur.Admin);

        var resultat = await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        Assert.All(resultat, u => Assert.NotNull(u.Email));
    }

    [Fact]
    public async Task ExecuterAsync_AppelantSimple_NeVoitQueSonPropreEmail()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var moi = new Utilisateur("moi@exemple.test", "Moi", "hash", "sel", 600_000, RoleUtilisateur.Simple);
        var autre = new Utilisateur("autre@exemple.test", "Autre", "hash", "sel", 600_000, RoleUtilisateur.Simple);
        await utilisateurRepository.AjouterAsync(moi, TestContext.Current.CancellationToken);
        await utilisateurRepository.AjouterAsync(autre, TestContext.Current.CancellationToken);

        var useCase = new ListerUtilisateursAvecFavoris(
            utilisateurRepository, new FakeFavoriRestaurantRepository(), new FakeRestaurantRepository());
        var request = new ListerUtilisateursAvecFavorisRequest(moi.Id, RoleUtilisateur.Simple);

        var resultat = await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        var monDto = resultat.Single(u => u.Id == moi.Id);
        var autreDto = resultat.Single(u => u.Id == autre.Id);
        Assert.Equal(moi.Email, monDto.Email);
        Assert.Null(autreDto.Email);
    }
}
