using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.ListerCategories;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.Tests.UseCases;

public class ListerCategoriesTests
{
    [Fact]
    public async Task ExecuterAsync_CatalogueVide_RetourneUneListeVide()
    {
        var categorieRepository = new FakeCategorieRepository();
        var useCase = new ListerCategories(categorieRepository);

        var resultat = await useCase.ExecuterAsync(TestContext.Current.CancellationToken);

        Assert.Empty(resultat);
    }

    [Fact]
    public async Task ExecuterAsync_PlusieursCategories_RetourneLeCatalogueTrieParGroupePuisNom()
    {
        var categorieRepository = new FakeCategorieRepository();
        categorieRepository.Ajouter(new Categorie("Terrasse", "Autres caractéristiques"));
        categorieRepository.Ajouter(new Categorie("Italienne", "Type de cuisine"));
        categorieRepository.Ajouter(new Categorie("Française", "Type de cuisine"));
        var useCase = new ListerCategories(categorieRepository);

        var resultat = await useCase.ExecuterAsync(TestContext.Current.CancellationToken);

        Assert.Equal(
            ["Terrasse", "Française", "Italienne"],
            resultat.Select(c => c.Nom));
    }
}
