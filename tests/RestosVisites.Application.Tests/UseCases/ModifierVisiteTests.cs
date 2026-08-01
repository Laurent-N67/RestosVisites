using RestosVisites.Application.Exceptions;
using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.ModifierVisite;
using RestosVisites.Domain.Entities;
using RestosVisites.Domain.ValueObjects;

namespace RestosVisites.Application.Tests.UseCases;

public class ModifierVisiteTests
{
    private static readonly Guid RestaurantIdValide = Guid.NewGuid();
    private static readonly DateOnly DateValide = new(2026, 1, 15);

    private static async Task<(FakeVisiteRepository VisiteRepository, Visite Visite)> CreerVisiteExistanteAsync()
    {
        var visiteRepository = new FakeVisiteRepository();
        var visite = new Visite(RestaurantIdValide, DateValide, new Note(3), "Correct");
        await visiteRepository.AjouterAsync(visite, TestContext.Current.CancellationToken);
        return (visiteRepository, visite);
    }

    [Fact]
    public async Task ExecuterAsync_CasNominal_MetAJourLaVisite()
    {
        var (visiteRepository, visite) = await CreerVisiteExistanteAsync();
        var categorieRepository = new FakeCategorieRepository();
        var useCase = new ModifierVisite(categorieRepository, visiteRepository);
        var nouvelleDate = new DateOnly(2026, 2, 1);
        var request = new ModifierVisiteRequest(
            visite.Id,
            nouvelleDate,
            5,
            "Excellent accueil",
            ["Italien"],
            ["https://exemple.test/photo.jpg"]);

        await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        var visiteModifiee = Assert.Single(visiteRepository.Visites);
        Assert.Equal(nouvelleDate, visiteModifiee.Date);
        Assert.Equal(5, visiteModifiee.Note.Valeur);
        Assert.Equal("Excellent accueil", visiteModifiee.Commentaire);
        Assert.Equal("Italien", Assert.Single(visiteModifiee.Categories).Nom);
        Assert.Equal("https://exemple.test/photo.jpg", Assert.Single(visiteModifiee.Photos).Url);
    }

    [Fact]
    public async Task ExecuterAsync_VisiteInexistante_LeveErreurApplicationExceptionRessourceNonTrouvee()
    {
        var visiteRepository = new FakeVisiteRepository();
        var categorieRepository = new FakeCategorieRepository();
        var useCase = new ModifierVisite(categorieRepository, visiteRepository);
        var request = new ModifierVisiteRequest(Guid.NewGuid(), DateValide, 4, null, [], []);

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(
            () => useCase.ExecuterAsync(request, TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RessourceNonTrouvee, exception.Type);
    }

    [Fact]
    public async Task ExecuterAsync_CategorieRetireeDeLaListe_EstDissociee()
    {
        var (visiteRepository, visite) = await CreerVisiteExistanteAsync();
        var categorieRepository = new FakeCategorieRepository();
        var categorie = new Categorie("Italien");
        await categorieRepository.AjouterAsync(categorie, TestContext.Current.CancellationToken);
        visite.AjouterCategorie(categorie);
        var useCase = new ModifierVisite(categorieRepository, visiteRepository);
        var request = new ModifierVisiteRequest(visite.Id, DateValide, 3, null, [], []);

        await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        Assert.Empty(visite.Categories);
    }

    [Fact]
    public async Task ExecuterAsync_CategorieExistante_ReutiliseLaCategorieSansDoublon()
    {
        var (visiteRepository, visite) = await CreerVisiteExistanteAsync();
        var categorieRepository = new FakeCategorieRepository();
        var categorieExistante = new Categorie("Italien");
        await categorieRepository.AjouterAsync(categorieExistante, TestContext.Current.CancellationToken);
        var useCase = new ModifierVisite(categorieRepository, visiteRepository);
        var request = new ModifierVisiteRequest(visite.Id, DateValide, 3, null, ["Italien"], []);

        await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        Assert.Single(categorieRepository.Categories);
        Assert.Equal(categorieExistante.Id, Assert.Single(visite.Categories).Id);
    }

    [Fact]
    public async Task ExecuterAsync_CategorieInexistante_CreeUneNouvelleCategorie()
    {
        var (visiteRepository, visite) = await CreerVisiteExistanteAsync();
        var categorieRepository = new FakeCategorieRepository();
        var useCase = new ModifierVisite(categorieRepository, visiteRepository);
        var request = new ModifierVisiteRequest(visite.Id, DateValide, 3, null, ["Italien"], []);

        await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        var categorieCreee = Assert.Single(categorieRepository.Categories);
        Assert.Equal("Italien", categorieCreee.Nom);
        Assert.Equal(categorieCreee.Id, Assert.Single(visite.Categories).Id);
    }

    [Fact]
    public async Task ExecuterAsync_CategorieConserveeDansLaNouvelleListe_NestPasDupliquee()
    {
        var (visiteRepository, visite) = await CreerVisiteExistanteAsync();
        var categorieRepository = new FakeCategorieRepository();
        var categorieExistante = new Categorie("Italien");
        await categorieRepository.AjouterAsync(categorieExistante, TestContext.Current.CancellationToken);
        visite.AjouterCategorie(categorieExistante);
        var useCase = new ModifierVisite(categorieRepository, visiteRepository);
        var request = new ModifierVisiteRequest(visite.Id, DateValide, 3, null, ["Italien"], []);

        await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        Assert.Single(visite.Categories);
    }

    [Fact]
    public async Task ExecuterAsync_PhotoRetireeDeLaListe_EstSupprimee()
    {
        var (visiteRepository, visite) = await CreerVisiteExistanteAsync();
        visite.AjouterPhoto(new Photo("https://exemple.test/photo.jpg"));
        var categorieRepository = new FakeCategorieRepository();
        var useCase = new ModifierVisite(categorieRepository, visiteRepository);
        var request = new ModifierVisiteRequest(visite.Id, DateValide, 3, null, [], []);

        await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        Assert.Empty(visite.Photos);
    }

    [Fact]
    public async Task ExecuterAsync_PhotoConserveeDansLaNouvelleListe_NestPasDupliquee()
    {
        var (visiteRepository, visite) = await CreerVisiteExistanteAsync();
        visite.AjouterPhoto(new Photo("https://exemple.test/photo.jpg"));
        var categorieRepository = new FakeCategorieRepository();
        var useCase = new ModifierVisite(categorieRepository, visiteRepository);
        var request = new ModifierVisiteRequest(
            visite.Id, DateValide, 3, null, [], ["https://exemple.test/photo.jpg"]);

        await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        Assert.Single(visite.Photos);
    }

    [Fact]
    public async Task ExecuterAsync_NouvellePhoto_EstAjoutee()
    {
        var (visiteRepository, visite) = await CreerVisiteExistanteAsync();
        var categorieRepository = new FakeCategorieRepository();
        var useCase = new ModifierVisite(categorieRepository, visiteRepository);
        var request = new ModifierVisiteRequest(
            visite.Id, DateValide, 3, null, [], ["https://exemple.test/photo1.jpg", "https://exemple.test/photo2.jpg"]);

        await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        Assert.Equal(2, visite.Photos.Count);
        Assert.Contains(visite.Photos, p => p.Url == "https://exemple.test/photo1.jpg");
        Assert.Contains(visite.Photos, p => p.Url == "https://exemple.test/photo2.jpg");
    }

    [Fact]
    public async Task ExecuterAsync_UrlsPhotosEnDoublonDansLaRequete_NestAjouteeQuUneFois()
    {
        var (visiteRepository, visite) = await CreerVisiteExistanteAsync();
        var categorieRepository = new FakeCategorieRepository();
        var useCase = new ModifierVisite(categorieRepository, visiteRepository);
        var request = new ModifierVisiteRequest(
            visite.Id, DateValide, 3, null, [], ["https://exemple.test/photo.jpg", "https://exemple.test/photo.jpg"]);

        await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        Assert.Equal("https://exemple.test/photo.jpg", Assert.Single(visite.Photos).Url);
    }
}
