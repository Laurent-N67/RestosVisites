using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using RestosVisites.Application.UseCases.RecompresserPhotosExistantes;
using RestosVisites.Domain.Entities;
using RestosVisites.Domain.Enums;
using RestosVisites.Domain.ValueObjects;
using RestosVisites.Infrastructure.Persistence;
using RestosVisites.Infrastructure.Persistence.Repositories;
using RestosVisites.Infrastructure.Storage;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.PixelFormats;

namespace RestosVisites.Infrastructure.Tests.UseCases;

/// <summary>
/// Test d'intégration bout-en-bout du cas d'usage <see cref="RecompresserPhotosExistantes"/>, avec
/// un vrai <see cref="RestosVisitesDbContext"/> (SQLite) et un vrai <see cref="FichierPhotoStorage"/>
/// (fichiers sur disque) — délibérément SANS aucun fake, contrairement à
/// RecompresserPhotosExistantesTests (Application.Tests) qui utilise FakeVisiteRepository.
///
/// Ce test reproduit exactement le scénario qui a révélé un bug critique : ListerToutesAsync
/// retourne des entités détachées (AsNoTracking), et le fake de repository utilisé par
/// RecompresserPhotosExistantesTests renvoie les mêmes références d'objets en mémoire qu'il stocke,
/// masquant totalement la distinction "suivi/détaché" propre à EF Core. Avec un vrai DbContext, muter
/// une entité obtenue via une requête AsNoTracking puis appeler SaveChangesAsync() ne persiste rien :
/// seule une relecture depuis un DbContext fraîchement créé peut révéler ce genre de régression.
/// </summary>
public sealed class RecompresserPhotosExistantesIntegrationTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly string _dossierPhotos;

    public RecompresserPhotosExistantesIntegrationTests()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();

        using (var dbContext = CreerDbContext())
        {
            dbContext.Database.EnsureCreated();
        }

        _dossierPhotos = Path.Combine(Path.GetTempPath(), "RestosVisitesTests", Guid.NewGuid().ToString("N"));
    }

    public void Dispose()
    {
        _connection.Dispose();

        if (Directory.Exists(_dossierPhotos))
        {
            Directory.Delete(_dossierPhotos, recursive: true);
        }
    }

    private RestosVisitesDbContext CreerDbContext()
    {
        var options = new DbContextOptionsBuilder<RestosVisitesDbContext>()
            .UseSqlite(_connection)
            .Options;

        return new RestosVisitesDbContext(options);
    }

    [Fact]
    public async Task ExecuterAsync_PhotoAuFormatAncien_PersisteReellementLaNouvelleUrlEnBase()
    {
        // Arrange : un restaurant, un utilisateur, et une visite avec une photo au format ancien
        // (vrai JPEG écrit directement sur disque, comme le serait une photo historique jamais
        // recompressée), tous persistés via de vrais repositories EF.
        var restaurant = new Restaurant("Le Gourmet", "1 rue de Test", 45.0, 4.0);
        var utilisateur = new Utilisateur("personne@exemple.test", "Personne", "hash", "sel", 600_000, RoleUtilisateur.Simple);

        Directory.CreateDirectory(_dossierPhotos);
        var ancienNomFichier = $"{Guid.NewGuid()}.jpg";
        var ancienCheminComplet = Path.Combine(_dossierPhotos, ancienNomFichier);
        await EcrireJpegDeTestAsync(ancienCheminComplet, 1000, 800, TestContext.Current.CancellationToken);
        var ancienneUrl = $"/uploads/{ancienNomFichier}";
        var tailleAvantOctetsFichier = new FileInfo(ancienCheminComplet).Length;

        var visite = new Visite(restaurant.Id, utilisateur.Id, new DateOnly(2026, 1, 15), new Note(5));
        visite.AjouterPhoto(new Photo(ancienneUrl));

        await using (var dbContext = CreerDbContext())
        {
            await dbContext.Restaurants.AddAsync(restaurant, TestContext.Current.CancellationToken);
            await dbContext.Utilisateurs.AddAsync(utilisateur, TestContext.Current.CancellationToken);
            await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);

            var visiteRepository = new VisiteRepository(dbContext);
            await visiteRepository.AjouterAsync(visite, TestContext.Current.CancellationToken);
        }

        // Act : exécute le cas d'usage avec un DbContext (et donc un VisiteRepository) fraîchement
        // créé, comme le ferait réellement l'API (une instance scoped par requête HTTP), et le vrai
        // FichierPhotoStorage pointant vers le même dossier que la photo de test.
        await using var dbContextUseCase = CreerDbContext();
        var repositoryUseCase = new VisiteRepository(dbContextUseCase);
        var photoStorage = new FichierPhotoStorage(new PhotoStorageOptions(_dossierPhotos));
        var useCase = new RecompresserPhotosExistantes(repositoryUseCase, photoStorage);

        var resultat = await useCase.ExecuterAsync(TestContext.Current.CancellationToken);

        // Assert (sur la réponse) : le résumé retourné par l'endpoint est plausible...
        Assert.Equal(1, resultat.PhotosRecompressees);
        Assert.Equal(0, resultat.PhotosEnErreur);
        Assert.Equal(tailleAvantOctetsFichier, resultat.TailleAvantOctetsTotale);

        // ... mais ce qui compte réellement, c'est ce qui a été persisté : relit la visite depuis un
        // DbContext totalement différent, qui n'a jamais vu ni la visite ni la photo d'origine.
        await using var dbContextRelecture = CreerDbContext();
        var repositoryRelecture = new VisiteRepository(dbContextRelecture);
        var visiteRelue = await repositoryRelecture.ObtenirParIdAsync(visite.Id, TestContext.Current.CancellationToken);

        Assert.NotNull(visiteRelue);
        var photoRelue = Assert.Single(visiteRelue.Photos);

        // Le cœur du bug corrigé : sans la correction, cette assertion échouait (l'URL relue restait
        // l'ancienne, jamais mise à jour en base malgré la réponse 200 de l'endpoint).
        Assert.NotEqual(ancienneUrl, photoRelue.Url);
        Assert.StartsWith("/uploads/", photoRelue.Url);
        Assert.EndsWith(".webp", photoRelue.Url);

        // L'ancien fichier a bien été supprimé et le nouveau fichier référencé en base existe belle et
        // bien sur disque, et il est effectivement plus léger.
        Assert.False(File.Exists(ancienCheminComplet));
        var nouveauCheminComplet = Path.Combine(_dossierPhotos, photoRelue.Url["/uploads/".Length..]);
        Assert.True(File.Exists(nouveauCheminComplet));
        Assert.True(new FileInfo(nouveauCheminComplet).Length < tailleAvantOctetsFichier);
    }

    private static async Task EcrireJpegDeTestAsync(string cheminComplet, int largeur, int hauteur, CancellationToken ct)
    {
        using var image = new Image<Rgba32>(largeur, hauteur, Color.CornflowerBlue.ToPixel<Rgba32>());
        await using var fichier = new FileStream(cheminComplet, FileMode.CreateNew, FileAccess.Write);
        await image.SaveAsync(fichier, new JpegEncoder(), ct);
    }
}
