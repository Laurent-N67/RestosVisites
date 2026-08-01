using RestosVisites.Domain.Entities;
using RestosVisites.Infrastructure.Persistence.Repositories;

namespace RestosVisites.Infrastructure.Tests.Repositories;

public sealed class RestaurantRepositoryTests : SqliteTestBase
{
    [Fact]
    public async Task AjouterAsync_PuisObtenirParIdAsync_DepuisNouveauDbContext_RetrouveLeRestaurant()
    {
        var restaurant = new Restaurant("Le Petit Bouchon", "12 rue de la Paix, Lyon", 45.75, 4.85);

        await using (var dbContext = CreerDbContext())
        {
            var repository = new RestaurantRepository(dbContext);
            await repository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);
        }

        await using var autreDbContext = CreerDbContext();
        var autreRepository = new RestaurantRepository(autreDbContext);
        var restaurantRelu = await autreRepository.ObtenirParIdAsync(restaurant.Id, TestContext.Current.CancellationToken);

        Assert.NotNull(restaurantRelu);
        Assert.Equal(restaurant.Id, restaurantRelu.Id);
        Assert.Equal(restaurant.Nom, restaurantRelu.Nom);
        Assert.Equal(restaurant.Adresse, restaurantRelu.Adresse);
        Assert.Equal(restaurant.Latitude, restaurantRelu.Latitude);
        Assert.Equal(restaurant.Longitude, restaurantRelu.Longitude);
    }

    [Fact]
    public async Task ObtenirParNomEtAdresseAsync_QuandLeRestaurantExiste_LeRetourne()
    {
        var restaurant = new Restaurant("Chez Mario", "3 avenue Foch, Paris", 48.87, 2.29);

        await using (var dbContext = CreerDbContext())
        {
            var repository = new RestaurantRepository(dbContext);
            await repository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);
        }

        await using var autreDbContext = CreerDbContext();
        var autreRepository = new RestaurantRepository(autreDbContext);
        var restaurantRelu = await autreRepository.ObtenirParNomEtAdresseAsync(
            "Chez Mario", "3 avenue Foch, Paris", TestContext.Current.CancellationToken);

        Assert.NotNull(restaurantRelu);
        Assert.Equal(restaurant.Id, restaurantRelu.Id);
    }

    [Fact]
    public async Task ObtenirParNomEtAdresseAsync_QuandLeRestaurantNExistePas_RetourneNull()
    {
        await using var dbContext = CreerDbContext();
        var repository = new RestaurantRepository(dbContext);

        var restaurantRelu = await repository.ObtenirParNomEtAdresseAsync(
            "Inconnu", "Nulle part", TestContext.Current.CancellationToken);

        Assert.Null(restaurantRelu);
    }

    [Fact]
    public async Task ListerAsync_RetourneTousLesRestaurantsAjoutes()
    {
        var premier = new Restaurant("Le Premier", "1 rue A, Lyon", 45.0, 4.0);
        var second = new Restaurant("Le Second", "2 rue B, Lyon", 45.1, 4.1);

        await using (var dbContext = CreerDbContext())
        {
            var repository = new RestaurantRepository(dbContext);
            await repository.AjouterAsync(premier, TestContext.Current.CancellationToken);
            await repository.AjouterAsync(second, TestContext.Current.CancellationToken);
        }

        await using var autreDbContext = CreerDbContext();
        var autreRepository = new RestaurantRepository(autreDbContext);
        var restaurants = await autreRepository.ListerAsync(TestContext.Current.CancellationToken);

        Assert.Equal(2, restaurants.Count);
        Assert.Contains(restaurants, r => r.Id == premier.Id);
        Assert.Contains(restaurants, r => r.Id == second.Id);
    }

    [Fact]
    public async Task AjouterAsync_AvecCategories_RepeupleLaCollectionDepuisNouveauDbContext()
    {
        var categorie = new Categorie("Italienne", "Type de cuisine");
        var restaurant = new Restaurant("Le Petit Bouchon", "12 rue de la Paix, Lyon", 45.75, 4.85, [categorie]);

        await using (var dbContext = CreerDbContext())
        {
            await dbContext.Categories.AddAsync(categorie, TestContext.Current.CancellationToken);
            var repository = new RestaurantRepository(dbContext);
            await repository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);
        }

        await using var autreDbContext = CreerDbContext();
        var autreRepository = new RestaurantRepository(autreDbContext);
        var restaurantRelu = await autreRepository.ObtenirParIdAsync(restaurant.Id, TestContext.Current.CancellationToken);

        Assert.NotNull(restaurantRelu);
        Assert.Equal(categorie.Id, Assert.Single(restaurantRelu.Categories).Id);
    }

    [Fact]
    public async Task MettreAJourAsync_AvecNouvellesCategories_RemplaceLesCategoriesEnBase()
    {
        var categorieInitiale = new Categorie("Italienne", "Type de cuisine");
        var nouvelleCategorie = new Categorie("Terrasse", "Autres caractéristiques");
        var restaurant = new Restaurant("Le Petit Bouchon", "12 rue de la Paix, Lyon", 45.75, 4.85, [categorieInitiale]);

        await using (var dbContext = CreerDbContext())
        {
            await dbContext.Categories.AddRangeAsync([categorieInitiale, nouvelleCategorie]);
            var repository = new RestaurantRepository(dbContext);
            await repository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);
        }

        await using (var dbContext = CreerDbContext())
        {
            var repository = new RestaurantRepository(dbContext);
            var restaurantATracker = await repository.ObtenirParIdAsync(restaurant.Id, TestContext.Current.CancellationToken);
            Assert.NotNull(restaurantATracker);

            var categorieTrackee = await dbContext.Categories.FindAsync([nouvelleCategorie.Id], TestContext.Current.CancellationToken);
            Assert.NotNull(categorieTrackee);

            restaurantATracker.DefinirCategories([categorieTrackee]);
            await repository.MettreAJourAsync(restaurantATracker, TestContext.Current.CancellationToken);
        }

        await using var autreDbContext = CreerDbContext();
        var autreRepository = new RestaurantRepository(autreDbContext);
        var restaurantRelu = await autreRepository.ObtenirParIdAsync(restaurant.Id, TestContext.Current.CancellationToken);

        Assert.NotNull(restaurantRelu);
        Assert.Equal(nouvelleCategorie.Id, Assert.Single(restaurantRelu.Categories).Id);
    }
}
