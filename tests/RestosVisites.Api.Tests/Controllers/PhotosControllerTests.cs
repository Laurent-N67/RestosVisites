using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using RestosVisites.Api.Controllers;
using RestosVisites.Infrastructure.Storage;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.PixelFormats;

namespace RestosVisites.Api.Tests.Controllers;

/// <summary>
/// Utilise un dossier de stockage temporaire dédié (et non le "wwwroot/uploads" réel de l'Api),
/// remplacé dans le conteneur DI via <see cref="WebApplicationFactory{TEntryPoint}.WithWebHostBuilder"/>,
/// afin de ne jamais polluer le dossier d'upload du projet et de pouvoir vérifier la présence réelle
/// du fichier écrit sur disque.
/// </summary>
public sealed class PhotosControllerTests : IClassFixture<RestosVisitesWebApplicationFactory>, IDisposable
{
    // Signature JPEG minimale valide (SOI + APP0 + EOI), suffisante pour passer la vérification des magic
    // bytes du contrôleur, mais volontairement non décodable (pas de données de scan) : utilisée uniquement
    // par les tests qui n'atteignent jamais l'étape de décodage/compression (rejet avant, ou non authentifié).
    private static readonly byte[] ContenuJpegValide =
    [
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0xFF, 0xD9,
    ];

    // Signature binaire ("magic bytes") d'un fichier WebP : conteneur RIFF avec sous-type "WEBP".
    private static readonly byte[] EnTeteRiff = "RIFF"u8.ToArray();
    private static readonly byte[] EnTeteWebp = "WEBP"u8.ToArray();

    private readonly string _dossierUploadsTest;
    private readonly HttpClient _client;

    public PhotosControllerTests(RestosVisitesWebApplicationFactory factory)
    {
        _dossierUploadsTest = Path.Combine(Path.GetTempPath(), "RestosVisitesTests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_dossierUploadsTest);

        var factoryAvecStockageTemporaire = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descripteurOptions = services.SingleOrDefault(d => d.ServiceType == typeof(PhotoStorageOptions));
                if (descripteurOptions is not null)
                {
                    services.Remove(descripteurOptions);
                }

                services.AddSingleton(new PhotoStorageOptions(_dossierUploadsTest));
            });
        });

        _client = factoryAvecStockageTemporaire.CreateClient();
    }

    public void Dispose()
    {
        _client.Dispose();

        if (Directory.Exists(_dossierUploadsTest))
        {
            Directory.Delete(_dossierUploadsTest, recursive: true);
        }
    }

    [Fact]
    public async Task Post_FichierImageValide_Retourne201EtEcritUnFichierWebpCompresseSurDisque()
    {
        await AuthTestHelper.InscrireEtConnecterAsync(_client, ct: TestContext.Current.CancellationToken);

        // Une vraie image décodable (contrairement à ContenuJpegValide, qui n'a pas de données de
        // scan) : ce test exerce désormais tout le pipeline, y compris le décodage/ré-encodage fait
        // par FichierPhotoStorage, pas seulement la validation des magic bytes du contrôleur.
        var contenuJpegDecodable = CreerContenuJpegDecodable();

        using var contenu = new MultipartFormDataContent();
        var fichier = new ByteArrayContent(contenuJpegDecodable);
        fichier.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");
        contenu.Add(fichier, "file", "photo.jpg");

        var response = await _client.PostAsync("/api/photos", contenu, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<UploaderPhotoResponse>(TestContext.Current.CancellationToken);
        Assert.NotNull(body);
        Assert.StartsWith("/uploads/", body.Url);
        // Le fichier stocké est toujours ré-encodé en WebP, quel que soit le format d'entrée.
        Assert.EndsWith(".webp", body.Url);

        var nomFichier = body.Url["/uploads/".Length..];
        var cheminSurDisque = Path.Combine(_dossierUploadsTest, nomFichier);
        Assert.True(File.Exists(cheminSurDisque));

        var octetsStockes = await File.ReadAllBytesAsync(cheminSurDisque, TestContext.Current.CancellationToken);
        // Vérifie les vrais magic bytes WebP sur le fichier écrit, pas seulement l'extension du nom.
        Assert.Equal(EnTeteRiff, octetsStockes[..4]);
        Assert.Equal(EnTeteWebp, octetsStockes[8..12]);
        // Le contenu a bien été recompressé (jamais un simple passthrough des octets JPEG d'origine).
        Assert.NotEqual(contenuJpegDecodable, octetsStockes);

        // Se recharge réellement comme une image WebP valide.
        using var image = await Image.LoadAsync(cheminSurDisque, TestContext.Current.CancellationToken);
        Assert.Equal("image/webp", image.Metadata.DecodedImageFormat?.DefaultMimeType);
    }

    private static byte[] CreerContenuJpegDecodable()
    {
        using var image = new Image<Rgba32>(64, 48, Color.CornflowerBlue.ToPixel<Rgba32>());
        using var flux = new MemoryStream();
        image.Save(flux, new JpegEncoder());
        return flux.ToArray();
    }

    [Fact]
    public async Task Post_FichierTropGros_Retourne400()
    {
        await AuthTestHelper.InscrireEtConnecterAsync(_client, ct: TestContext.Current.CancellationToken);

        // Volontairement juste au-dessus de la limite de 50 Mo (mais sous la limite globale de requête,
        // qui inclut une marge pour l'en-tête multipart) afin d'exercer précisément la vérification
        // explicite de taille du contrôleur plutôt que le rejet bas niveau de la requête.
        var contenuTropGros = new byte[50 * 1024 * 1024 + 1024];
        // Signature JPEG valide en tête, pour s'assurer que c'est bien la taille qui est rejetée.
        Array.Copy(ContenuJpegValide, contenuTropGros, ContenuJpegValide.Length);

        using var contenu = new MultipartFormDataContent();
        var fichier = new ByteArrayContent(contenuTropGros);
        fichier.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");
        contenu.Add(fichier, "file", "photo-trop-grosse.jpg");

        var response = await _client.PostAsync("/api/photos", contenu, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_TypeDeFichierNonAutorise_Retourne400()
    {
        await AuthTestHelper.InscrireEtConnecterAsync(_client, ct: TestContext.Current.CancellationToken);

        using var contenu = new MultipartFormDataContent();
        var fichier = new ByteArrayContent("Ceci n'est pas une image."u8.ToArray());
        fichier.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("text/plain");
        contenu.Add(fichier, "file", "document.txt");

        var response = await _client.PostAsync("/api/photos", contenu, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_FichierRenommeAvecExtensionImageMaisContenuInvalide_Retourne400()
    {
        await AuthTestHelper.InscrireEtConnecterAsync(_client, ct: TestContext.Current.CancellationToken);

        using var contenu = new MultipartFormDataContent();
        var fichier = new ByteArrayContent("Ceci n'est pas vraiment une image JPEG."u8.ToArray());
        fichier.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");
        contenu.Add(fichier, "file", "faux.jpg");

        var response = await _client.PostAsync("/api/photos", contenu, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_AucunFichier_Retourne400()
    {
        await AuthTestHelper.InscrireEtConnecterAsync(_client, ct: TestContext.Current.CancellationToken);

        using var contenu = new MultipartFormDataContent();

        var response = await _client.PostAsync("/api/photos", contenu, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_UtilisateurNonAuthentifie_Retourne401()
    {
        using var contenu = new MultipartFormDataContent();
        var fichier = new ByteArrayContent(ContenuJpegValide);
        fichier.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");
        contenu.Add(fichier, "file", "photo.jpg");

        var response = await _client.PostAsync("/api/photos", contenu, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
