using RestosVisites.Application.Abstractions;
using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.RecompresserPhotosExistantes;
using RestosVisites.Domain.Entities;
using RestosVisites.Domain.ValueObjects;

namespace RestosVisites.Application.Tests.UseCases;

public class RecompresserPhotosExistantesTests
{
    private static Visite CreerVisiteAvecPhotos(params string[] urls)
    {
        var visite = new Visite(Guid.NewGuid(), Guid.NewGuid(), new DateOnly(2026, 1, 15), new Note(4));
        foreach (var url in urls)
        {
            visite.AjouterPhoto(new Photo(url));
        }

        return visite;
    }

    [Fact]
    public async Task ExecuterAsync_AucuneVisite_RetourneUnResumeVide()
    {
        var useCase = new RecompresserPhotosExistantes(new FakeVisiteRepository(), new FakePhotoStorage());

        var resultat = await useCase.ExecuterAsync(TestContext.Current.CancellationToken);

        Assert.Equal(0, resultat.PhotosRecompressees);
        Assert.Equal(0, resultat.PhotosEnErreur);
        Assert.Equal(0, resultat.TailleAvantOctetsTotale);
        Assert.Equal(0, resultat.TailleApresOctetsTotale);
    }

    [Fact]
    public async Task ExecuterAsync_LotMixte_NeRecompresseEtNePersisteQueLesPhotosAuFormatAncien()
    {
        var visiteRepository = new FakeVisiteRepository();
        var photoStorage = new FakePhotoStorage();

        // Une photo déjà au format WebP (upload récent) et une URL externe : le fake ne retourne rien
        // pour elles (comportement par défaut, non configuré), simulant IPhotoStorage qui les ignore.
        var visiteDejaAJour = CreerVisiteAvecPhotos("/uploads/deja-webp.webp", "https://exemple.test/externe.jpg");
        await visiteRepository.AjouterAsync(visiteDejaAJour, TestContext.Current.CancellationToken);

        // Une visite avec deux photos au format ancien : les deux doivent être recompressées, mais la
        // visite ne doit être persistée qu'une seule fois (pas une fois par photo).
        var visiteAncienFormat = CreerVisiteAvecPhotos("/uploads/ancien1.jpg", "/uploads/ancien2.png");
        await visiteRepository.AjouterAsync(visiteAncienFormat, TestContext.Current.CancellationToken);

        photoStorage.ConfigurerResultat(
            "/uploads/ancien1.jpg", new PhotoRecompresseeResult("/uploads/nouveau1.webp", 5_000_000, 500_000));
        photoStorage.ConfigurerResultat(
            "/uploads/ancien2.png", new PhotoRecompresseeResult("/uploads/nouveau2.webp", 3_000_000, 300_000));

        var useCase = new RecompresserPhotosExistantes(visiteRepository, photoStorage);

        var resultat = await useCase.ExecuterAsync(TestContext.Current.CancellationToken);

        Assert.Equal(2, resultat.PhotosRecompressees);
        Assert.Equal(0, resultat.PhotosEnErreur);
        Assert.Equal(8_000_000, resultat.TailleAvantOctetsTotale);
        Assert.Equal(800_000, resultat.TailleApresOctetsTotale);

        // La visite déjà à jour n'a jamais été persistée : aucune de ses photos n'a changé.
        Assert.DoesNotContain(visiteDejaAJour.Id, visiteRepository.IdsMisAJour);
        Assert.Contains(visiteDejaAJour.Photos, p => p.Url == "/uploads/deja-webp.webp");
        Assert.Contains(visiteDejaAJour.Photos, p => p.Url == "https://exemple.test/externe.jpg");

        // La visite modifiée a bien été persistée une seule fois, malgré ses deux photos changées.
        Assert.Single(visiteRepository.IdsMisAJour, id => id == visiteAncienFormat.Id);
        Assert.Contains(visiteAncienFormat.Photos, p => p.Url == "/uploads/nouveau1.webp");
        Assert.Contains(visiteAncienFormat.Photos, p => p.Url == "/uploads/nouveau2.webp");
    }

    [Fact]
    public async Task ExecuterAsync_PhotoDontLeFichierEstIntrouvable_EstIgnoreeSansPersisterLaVisite()
    {
        var visiteRepository = new FakeVisiteRepository();
        var photoStorage = new FakePhotoStorage();

        // Fichier manquant : le fake IPhotoStorage se comporte comme l'implémentation réelle et
        // retourne null (pas configuré ici), sans lever d'exception.
        var visite = CreerVisiteAvecPhotos("/uploads/introuvable.jpg");
        await visiteRepository.AjouterAsync(visite, TestContext.Current.CancellationToken);

        var useCase = new RecompresserPhotosExistantes(visiteRepository, photoStorage);

        var resultat = await useCase.ExecuterAsync(TestContext.Current.CancellationToken);

        Assert.Equal(0, resultat.PhotosRecompressees);
        Assert.Equal(0, resultat.PhotosEnErreur);
        Assert.DoesNotContain(visite.Id, visiteRepository.IdsMisAJour);
        Assert.Equal("/uploads/introuvable.jpg", Assert.Single(visite.Photos).Url);
    }

    [Fact]
    public async Task ExecuterAsync_PhotoEnErreur_EstIgnoreeSansInterrompreLeTraitementDesAutres()
    {
        var visiteRepository = new FakeVisiteRepository();
        var photoStorage = new FakePhotoStorage();

        var visite = CreerVisiteAvecPhotos("/uploads/corrompue.jpg", "/uploads/valide.jpg");
        await visiteRepository.AjouterAsync(visite, TestContext.Current.CancellationToken);

        photoStorage.ConfigurerEnErreur("/uploads/corrompue.jpg");
        photoStorage.ConfigurerResultat(
            "/uploads/valide.jpg", new PhotoRecompresseeResult("/uploads/nouveau.webp", 1_000_000, 100_000));

        var useCase = new RecompresserPhotosExistantes(visiteRepository, photoStorage);

        var resultat = await useCase.ExecuterAsync(TestContext.Current.CancellationToken);

        Assert.Equal(1, resultat.PhotosRecompressees);
        Assert.Equal(1, resultat.PhotosEnErreur);
        Assert.Equal(1_000_000, resultat.TailleAvantOctetsTotale);
        Assert.Equal(100_000, resultat.TailleApresOctetsTotale);

        // La photo en erreur n'a pas été modifiée, mais la photo valide si, et la visite a bien été
        // persistée (au moins une photo a changé).
        Assert.Contains(visite.Photos, p => p.Url == "/uploads/corrompue.jpg");
        Assert.Contains(visite.Photos, p => p.Url == "/uploads/nouveau.webp");
        Assert.Single(visiteRepository.IdsMisAJour, id => id == visite.Id);
    }
}
