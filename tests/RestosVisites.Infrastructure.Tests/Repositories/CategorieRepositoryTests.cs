using RestosVisites.Domain.Entities;
using RestosVisites.Infrastructure.Persistence.Repositories;
using RestosVisites.Infrastructure.Persistence.Seed;

namespace RestosVisites.Infrastructure.Tests.Repositories;

public sealed class CategorieRepositoryTests : SqliteTestBase
{
    [Fact]
    public async Task ObtenirParIdAsync_CategorieExistante_DepuisNouveauDbContext_LaRetrouve()
    {
        var categorie = new Categorie("Italienne", "Type de cuisine");

        await using (var dbContext = CreerDbContext())
        {
            await dbContext.Categories.AddAsync(categorie, TestContext.Current.CancellationToken);
            await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        await using var autreDbContext = CreerDbContext();
        var autreRepository = new CategorieRepository(autreDbContext);
        var categorieRelue = await autreRepository.ObtenirParIdAsync(categorie.Id, TestContext.Current.CancellationToken);

        Assert.NotNull(categorieRelue);
        Assert.Equal(categorie.Id, categorieRelue.Id);
        Assert.Equal("Italienne", categorieRelue.Nom);
        Assert.Equal("Type de cuisine", categorieRelue.Groupe);
    }

    [Fact]
    public async Task ObtenirParIdAsync_QuandLaCategorieNExistePas_RetourneNull()
    {
        await using var dbContext = CreerDbContext();
        var repository = new CategorieRepository(dbContext);

        var categorieRelue = await repository.ObtenirParIdAsync(Guid.NewGuid(), TestContext.Current.CancellationToken);

        Assert.Null(categorieRelue);
    }

    [Fact]
    public async Task ListerAsync_RetourneToutesLesCategoriesAjoutees()
    {
        var premiere = new Categorie("Terrasse", "Autres caractéristiques");
        var seconde = new Categorie("Végan", "Autres caractéristiques");

        await using (var dbContext = CreerDbContext())
        {
            await dbContext.Categories.AddRangeAsync([premiere, seconde]);
            await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        await using var autreDbContext = CreerDbContext();
        var autreRepository = new CategorieRepository(autreDbContext);
        var categories = await autreRepository.ListerAsync(TestContext.Current.CancellationToken);

        Assert.Equal(2, categories.Count);
        Assert.Contains(categories, c => c.Id == premiere.Id);
        Assert.Contains(categories, c => c.Id == seconde.Id);
    }

    [Fact]
    public void IdPour_MemeGroupeEtNom_EstDeterministe()
    {
        var premier = CategorieSeedData.IdPour("Type de cuisine", "Italienne");
        var second = CategorieSeedData.IdPour("Type de cuisine", "Italienne");

        Assert.Equal(premier, second);
    }

    [Fact]
    public void IdPour_GroupeOuNomDifferent_ProduitDesIdsDifferents()
    {
        var id1 = CategorieSeedData.IdPour("Type de cuisine", "Italienne");
        var id2 = CategorieSeedData.IdPour("Type de cuisine", "Française");
        var id3 = CategorieSeedData.IdPour("Autres caractéristiques", "Italienne");

        Assert.NotEqual(id1, id2);
        Assert.NotEqual(id1, id3);
    }
}
