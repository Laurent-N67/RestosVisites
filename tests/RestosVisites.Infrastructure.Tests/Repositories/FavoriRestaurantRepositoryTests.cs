using RestosVisites.Domain.Entities;
using RestosVisites.Domain.Enums;
using RestosVisites.Infrastructure.Persistence.Repositories;

namespace RestosVisites.Infrastructure.Tests.Repositories;

public sealed class FavoriRestaurantRepositoryTests : SqliteTestBase
{
    private async Task<(Utilisateur Utilisateur, Restaurant Restaurant)> CreerUtilisateurEtRestaurantAsync()
    {
        var utilisateur = new Utilisateur("personne@exemple.test", "Personne", "hash", "sel", 600_000, RoleUtilisateur.Simple);
        var restaurant = new Restaurant("Le Bon Restaurant", "1 rue de la Paix", 48.8566, 2.3522);

        await using var dbContext = CreerDbContext();
        await dbContext.Utilisateurs.AddAsync(utilisateur, TestContext.Current.CancellationToken);
        await dbContext.Restaurants.AddAsync(restaurant, TestContext.Current.CancellationToken);
        await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);

        return (utilisateur, restaurant);
    }

    [Fact]
    public async Task AjouterAsync_PuisObtenirAsync_DepuisNouveauDbContext_RetrouveLeFavori()
    {
        var (utilisateur, restaurant) = await CreerUtilisateurEtRestaurantAsync();
        var dateAjout = new DateTimeOffset(2026, 1, 15, 10, 0, 0, TimeSpan.Zero);
        var favori = new FavoriRestaurant(utilisateur.Id, restaurant.Id, dateAjout);

        await using (var dbContext = CreerDbContext())
        {
            var repository = new FavoriRestaurantRepository(dbContext);
            await repository.AjouterAsync(favori, TestContext.Current.CancellationToken);
        }

        await using var autreDbContext = CreerDbContext();
        var autreRepository = new FavoriRestaurantRepository(autreDbContext);
        var favoriRelu = await autreRepository.ObtenirAsync(utilisateur.Id, restaurant.Id, TestContext.Current.CancellationToken);

        Assert.NotNull(favoriRelu);
        Assert.Equal(favori.Id, favoriRelu.Id);
        Assert.Equal(dateAjout, favoriRelu.DateAjout);
    }

    [Fact]
    public async Task ObtenirAsync_QuandLeFavoriNExistePas_RetourneNull()
    {
        await using var dbContext = CreerDbContext();
        var repository = new FavoriRestaurantRepository(dbContext);

        var favori = await repository.ObtenirAsync(Guid.NewGuid(), Guid.NewGuid(), TestContext.Current.CancellationToken);

        Assert.Null(favori);
    }

    [Fact]
    public async Task ListerParUtilisateurAsync_NeRetourneQueLesFavorisDeLUtilisateurDemande()
    {
        var (utilisateur, restaurant) = await CreerUtilisateurEtRestaurantAsync();
        var autreUtilisateur = new Utilisateur("autre@exemple.test", "Autre", "hash", "sel", 600_000, RoleUtilisateur.Simple);
        var autreRestaurant = new Restaurant("Autre Restaurant", "2 rue de la Paix", 45.0, 4.0);

        await using (var dbContext = CreerDbContext())
        {
            await dbContext.Utilisateurs.AddAsync(autreUtilisateur, TestContext.Current.CancellationToken);
            await dbContext.Restaurants.AddAsync(autreRestaurant, TestContext.Current.CancellationToken);
            await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);

            var repository = new FavoriRestaurantRepository(dbContext);
            await repository.AjouterAsync(
                new FavoriRestaurant(utilisateur.Id, restaurant.Id, DateTimeOffset.UtcNow), TestContext.Current.CancellationToken);
            await repository.AjouterAsync(
                new FavoriRestaurant(autreUtilisateur.Id, autreRestaurant.Id, DateTimeOffset.UtcNow), TestContext.Current.CancellationToken);
        }

        await using var autreDbContext = CreerDbContext();
        var autreRepository = new FavoriRestaurantRepository(autreDbContext);
        var favorisDeLUtilisateur = await autreRepository.ListerParUtilisateurAsync(utilisateur.Id, TestContext.Current.CancellationToken);

        var favori = Assert.Single(favorisDeLUtilisateur);
        Assert.Equal(restaurant.Id, favori.RestaurantId);
    }

    [Fact]
    public async Task SupprimerAsync_FavoriExistant_LeRetire()
    {
        var (utilisateur, restaurant) = await CreerUtilisateurEtRestaurantAsync();

        await using (var dbContext = CreerDbContext())
        {
            var repository = new FavoriRestaurantRepository(dbContext);
            await repository.AjouterAsync(
                new FavoriRestaurant(utilisateur.Id, restaurant.Id, DateTimeOffset.UtcNow), TestContext.Current.CancellationToken);
        }

        await using (var dbContext = CreerDbContext())
        {
            var repository = new FavoriRestaurantRepository(dbContext);
            await repository.SupprimerAsync(utilisateur.Id, restaurant.Id, TestContext.Current.CancellationToken);
        }

        await using var autreDbContext = CreerDbContext();
        var autreRepository = new FavoriRestaurantRepository(autreDbContext);
        var favoriRelu = await autreRepository.ObtenirAsync(utilisateur.Id, restaurant.Id, TestContext.Current.CancellationToken);

        Assert.Null(favoriRelu);
    }

    [Fact]
    public async Task SupprimerAsync_FavoriInexistant_NeLevePasDException()
    {
        await using var dbContext = CreerDbContext();
        var repository = new FavoriRestaurantRepository(dbContext);

        await repository.SupprimerAsync(Guid.NewGuid(), Guid.NewGuid(), TestContext.Current.CancellationToken);
    }
}
