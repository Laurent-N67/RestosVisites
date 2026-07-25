using RestosVisites.Domain.Entities;
using RestosVisites.Infrastructure.Persistence.Repositories;

namespace RestosVisites.Infrastructure.Tests.Repositories;

public sealed class CategorieRepositoryTests : SqliteTestBase
{
    [Fact]
    public async Task AjouterAsync_PuisObtenirParNomAsync_DepuisNouveauDbContext_RetrouveLaCategorie()
    {
        var categorie = new Categorie("Italien");

        await using (var dbContext = CreerDbContext())
        {
            var repository = new CategorieRepository(dbContext);
            await repository.AjouterAsync(categorie, TestContext.Current.CancellationToken);
        }

        await using var autreDbContext = CreerDbContext();
        var autreRepository = new CategorieRepository(autreDbContext);
        var categorieRelue = await autreRepository.ObtenirParNomAsync("Italien", TestContext.Current.CancellationToken);

        Assert.NotNull(categorieRelue);
        Assert.Equal(categorie.Id, categorieRelue.Id);
        Assert.Equal("Italien", categorieRelue.Nom);
    }

    [Fact]
    public async Task ObtenirParNomAsync_QuandLaCategorieNExistePas_RetourneNull()
    {
        await using var dbContext = CreerDbContext();
        var repository = new CategorieRepository(dbContext);

        var categorieRelue = await repository.ObtenirParNomAsync("Inexistante", TestContext.Current.CancellationToken);

        Assert.Null(categorieRelue);
    }

    [Fact]
    public async Task ListerAsync_RetourneToutesLesCategoriesAjoutees()
    {
        var premiere = new Categorie("Terrasse");
        var seconde = new Categorie("Vegan");

        await using (var dbContext = CreerDbContext())
        {
            var repository = new CategorieRepository(dbContext);
            await repository.AjouterAsync(premiere, TestContext.Current.CancellationToken);
            await repository.AjouterAsync(seconde, TestContext.Current.CancellationToken);
        }

        await using var autreDbContext = CreerDbContext();
        var autreRepository = new CategorieRepository(autreDbContext);
        var categories = await autreRepository.ListerAsync(TestContext.Current.CancellationToken);

        Assert.Equal(2, categories.Count);
        Assert.Contains(categories, c => c.Id == premiere.Id);
        Assert.Contains(categories, c => c.Id == seconde.Id);
    }
}
