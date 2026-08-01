using RestosVisites.Domain.Entities;
using RestosVisites.Domain.ValueObjects;
using RestosVisites.Infrastructure.Persistence.Repositories;

namespace RestosVisites.Infrastructure.Tests.Repositories;

public sealed class VisiteRepositoryTests : SqliteTestBase
{
    private async Task<Restaurant> CreerRestaurantAsync(string nom = "Le Gourmet", string adresse = "1 rue de Test")
    {
        var restaurant = new Restaurant(nom, adresse, 45.0, 4.0);

        await using var dbContext = CreerDbContext();
        var repository = new RestaurantRepository(dbContext);
        await repository.AjouterAsync(restaurant, TestContext.Current.CancellationToken);

        return restaurant;
    }

    [Fact]
    public async Task AjouterAsync_AvecPlusieursPhotos_RepeupleLaCollectionDepuisNouveauDbContext()
    {
        var restaurant = await CreerRestaurantAsync();

        var visite = new Visite(restaurant.Id, new DateOnly(2026, 7, 25), new Note(5), "Excellent repas");
        visite.AjouterPhoto(new Photo("https://exemple.test/photo1.jpg"));
        visite.AjouterPhoto(new Photo("https://exemple.test/photo2.jpg"));

        await using (var dbContext = CreerDbContext())
        {
            var repository = new VisiteRepository(dbContext);
            await repository.AjouterAsync(visite, TestContext.Current.CancellationToken);
        }

        await using var autreDbContext = CreerDbContext();
        var autreRepository = new VisiteRepository(autreDbContext);
        var visites = await autreRepository.ListerToutesAsync(TestContext.Current.CancellationToken);

        var visiteRelue = Assert.Single(visites);
        Assert.Equal(visite.Id, visiteRelue.Id);
        Assert.Equal(restaurant.Id, visiteRelue.RestaurantId);
        Assert.Equal(5, visiteRelue.Note.Valeur);
        Assert.Equal("Excellent repas", visiteRelue.Commentaire);
        Assert.Equal(2, visiteRelue.Photos.Count);
        Assert.Contains(visiteRelue.Photos, p => p.Url == "https://exemple.test/photo1.jpg");
        Assert.Contains(visiteRelue.Photos, p => p.Url == "https://exemple.test/photo2.jpg");
    }

    [Fact]
    public async Task ListerParRestaurantAsync_NeRetourneQueLesVisitesDuRestaurantDemande()
    {
        var premierRestaurant = await CreerRestaurantAsync("Restaurant A", "1 rue A");
        var secondRestaurant = await CreerRestaurantAsync("Restaurant B", "2 rue B");

        var visiteA = new Visite(premierRestaurant.Id, new DateOnly(2026, 1, 1), new Note(4));
        var visiteB = new Visite(secondRestaurant.Id, new DateOnly(2026, 1, 2), new Note(3));

        await using (var dbContext = CreerDbContext())
        {
            var repository = new VisiteRepository(dbContext);
            await repository.AjouterAsync(visiteA, TestContext.Current.CancellationToken);
            await repository.AjouterAsync(visiteB, TestContext.Current.CancellationToken);
        }

        await using var autreDbContext = CreerDbContext();
        var autreRepository = new VisiteRepository(autreDbContext);
        var visitesDuPremier = await autreRepository.ListerParRestaurantAsync(premierRestaurant.Id, TestContext.Current.CancellationToken);

        var visiteRelue = Assert.Single(visitesDuPremier);
        Assert.Equal(visiteA.Id, visiteRelue.Id);
    }

    [Fact]
    public async Task ListerToutesAsync_RetourneToutesLesVisitesTousRestaurantsConfondus()
    {
        var premierRestaurant = await CreerRestaurantAsync("Restaurant A", "1 rue A");
        var secondRestaurant = await CreerRestaurantAsync("Restaurant B", "2 rue B");

        var visiteA = new Visite(premierRestaurant.Id, new DateOnly(2026, 1, 1), new Note(4));
        var visiteB = new Visite(secondRestaurant.Id, new DateOnly(2026, 1, 2), new Note(3));

        await using (var dbContext = CreerDbContext())
        {
            var repository = new VisiteRepository(dbContext);
            await repository.AjouterAsync(visiteA, TestContext.Current.CancellationToken);
            await repository.AjouterAsync(visiteB, TestContext.Current.CancellationToken);
        }

        await using var autreDbContext = CreerDbContext();
        var autreRepository = new VisiteRepository(autreDbContext);
        var toutesLesVisites = await autreRepository.ListerToutesAsync(TestContext.Current.CancellationToken);

        Assert.Equal(2, toutesLesVisites.Count);
    }
}
