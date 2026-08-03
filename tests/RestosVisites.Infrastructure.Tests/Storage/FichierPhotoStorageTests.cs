using RestosVisites.Infrastructure.Storage;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Metadata.Profiles.Exif;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;

namespace RestosVisites.Infrastructure.Tests.Storage;

/// <summary>
/// Vérifie le pipeline de compression/optimisation appliqué par <see cref="FichierPhotoStorage"/> :
/// toute image entrante (JPEG/PNG/WebP, déjà validée en amont par le contrôleur) doit ressortir
/// ré-encodée en WebP, redimensionnée si nécessaire, et correctement orientée.
/// </summary>
public sealed class FichierPhotoStorageTests : IDisposable
{
    // Signature binaire ("magic bytes") d'un fichier WebP : conteneur RIFF avec sous-type "WEBP".
    private static readonly byte[] EnTeteRiff = "RIFF"u8.ToArray();
    private static readonly byte[] EnTeteWebp = "WEBP"u8.ToArray();

    private readonly string _dossierTest;
    private readonly FichierPhotoStorage _storage;

    public FichierPhotoStorageTests()
    {
        _dossierTest = Path.Combine(Path.GetTempPath(), "RestosVisitesTests", Guid.NewGuid().ToString("N"));
        _storage = new FichierPhotoStorage(new PhotoStorageOptions(_dossierTest));
    }

    public void Dispose()
    {
        if (Directory.Exists(_dossierTest))
        {
            Directory.Delete(_dossierTest, recursive: true);
        }
    }

    [Fact]
    public async Task EnregistrerAsync_ImageJpeg_EcritUnFichierWebpValideSurDisque()
    {
        await using var jpeg = CreerImageJpeg(400, 300);

        var url = await _storage.EnregistrerAsync(jpeg, TestContext.Current.CancellationToken);

        Assert.StartsWith("/uploads/", url);
        Assert.EndsWith(".webp", url);

        var cheminSurDisque = CheminDepuisUrl(url);
        Assert.True(File.Exists(cheminSurDisque));

        var octets = await File.ReadAllBytesAsync(cheminSurDisque, TestContext.Current.CancellationToken);
        AssertSignatureWebp(octets);

        // Se recharge réellement comme une image WebP valide (pas seulement les bons magic bytes).
        using var image = await Image.LoadAsync(cheminSurDisque, TestContext.Current.CancellationToken);
        Assert.Equal("image/webp", image.Metadata.DecodedImageFormat?.DefaultMimeType);
    }

    [Fact]
    public async Task EnregistrerAsync_ImagePng_EstAussiReencodeeEnWebp()
    {
        await using var png = CreerImagePng(200, 150);

        var url = await _storage.EnregistrerAsync(png, TestContext.Current.CancellationToken);

        Assert.EndsWith(".webp", url);

        var octets = await File.ReadAllBytesAsync(CheminDepuisUrl(url), TestContext.Current.CancellationToken);
        AssertSignatureWebp(octets);
    }

    [Fact]
    public async Task EnregistrerAsync_ImagePlusGrandeQue1920px_EstRedimensionneeSansDepasser1920SurLeCoteLePlusLong()
    {
        // Volontairement plus grand que la limite de 1920px sur la largeur (image "paysage").
        await using var jpeg = CreerImageJpeg(3000, 2000);

        var url = await _storage.EnregistrerAsync(jpeg, TestContext.Current.CancellationToken);

        using var image = await Image.LoadAsync(CheminDepuisUrl(url), TestContext.Current.CancellationToken);
        Assert.True(image.Width <= 1920);
        Assert.True(image.Height <= 1920);
        // Le ratio d'aspect (3:2) doit être préservé.
        Assert.Equal(1920, image.Width);
        Assert.Equal(1280, image.Height);
    }

    [Fact]
    public async Task EnregistrerAsync_ImagePlusPetiteQue1920px_NEstPasAgrandie()
    {
        await using var jpeg = CreerImageJpeg(100, 80);

        var url = await _storage.EnregistrerAsync(jpeg, TestContext.Current.CancellationToken);

        using var image = await Image.LoadAsync(CheminDepuisUrl(url), TestContext.Current.CancellationToken);
        Assert.Equal(100, image.Width);
        Assert.Equal(80, image.Height);
    }

    [Fact]
    public async Task EnregistrerAsync_ImageAvecOrientationExif_EstReorienteeAvantEncodage()
    {
        // Simule une photo de téléphone tenu "sur le côté" : les pixels sont stockés en 300x200
        // (paysage) mais le tag EXIF Orientation=6 ("RightTop") indique qu'il faut pivoter de 90°
        // pour obtenir l'affichage correct (portrait, 200x300). Sans l'appel à AutoOrient() dans
        // FichierPhotoStorage, l'image ré-encodée ressortirait de travers (toujours 300x200, pixels
        // non pivotés) au lieu de refléter l'orientation réelle voulue par le tag EXIF.
        await using var jpegAvecOrientation = CreerImageJpegAvecOrientationExif(300, 200, orientationExif: 6);

        var url = await _storage.EnregistrerAsync(jpegAvecOrientation, TestContext.Current.CancellationToken);

        using var image = await Image.LoadAsync(CheminDepuisUrl(url), TestContext.Current.CancellationToken);
        // Les dimensions sont inversées : la preuve que les pixels ont physiquement été pivotés
        // plutôt que de laisser le tag EXIF (non appliqué par les visionneuses WebP) tel quel.
        Assert.Equal(200, image.Width);
        Assert.Equal(300, image.Height);
    }

    [Fact]
    public async Task RecompresserSiNecessaireAsync_FichierAuFormatAncien_EstRemplaceParUnWebpEtLAncienDisparait()
    {
        // Simule une photo uploadée avant le pipeline de compression : un vrai JPEG déjà présent sur
        // disque, écrit directement (sans passer par EnregistrerAsync) pour reproduire fidèlement
        // l'état d'une photo historique jamais recompressée.
        Directory.CreateDirectory(_dossierTest);
        var ancienNomFichier = $"{Guid.NewGuid()}.jpg";
        var ancienCheminComplet = Path.Combine(_dossierTest, ancienNomFichier);
        byte[] octetsJpegOrigine;
        await using (var jpeg = CreerImageJpeg(1000, 800))
        {
            octetsJpegOrigine = jpeg.ToArray();
        }

        await File.WriteAllBytesAsync(ancienCheminComplet, octetsJpegOrigine, TestContext.Current.CancellationToken);
        var ancienneUrl = $"/uploads/{ancienNomFichier}";

        var resultat = await _storage.RecompresserSiNecessaireAsync(ancienneUrl, TestContext.Current.CancellationToken);

        Assert.NotNull(resultat);
        Assert.StartsWith("/uploads/", resultat.NouvelleUrl);
        Assert.EndsWith(".webp", resultat.NouvelleUrl);
        Assert.Equal(octetsJpegOrigine.Length, resultat.TailleAvantOctets);

        // L'ancien fichier a bien disparu.
        Assert.False(File.Exists(ancienCheminComplet));

        // Le nouveau fichier existe, est un WebP valide et rechargeable, et son poids correspond à ce
        // qui a été retourné.
        var nouveauCheminComplet = CheminDepuisUrl(resultat.NouvelleUrl);
        Assert.True(File.Exists(nouveauCheminComplet));
        var octetsNouveauFichier = await File.ReadAllBytesAsync(nouveauCheminComplet, TestContext.Current.CancellationToken);
        AssertSignatureWebp(octetsNouveauFichier);
        Assert.Equal(octetsNouveauFichier.LongLength, resultat.TailleApresOctets);

        using var image = await Image.LoadAsync(nouveauCheminComplet, TestContext.Current.CancellationToken);
        Assert.Equal("image/webp", image.Metadata.DecodedImageFormat?.DefaultMimeType);
    }

    [Fact]
    public async Task RecompresserSiNecessaireAsync_FichierDejaWebp_NeFaitRienEtRetourneNull()
    {
        await using var jpeg = CreerImageJpeg(400, 300);
        var urlDejaCompressee = await _storage.EnregistrerAsync(jpeg, TestContext.Current.CancellationToken);

        var resultat = await _storage.RecompresserSiNecessaireAsync(urlDejaCompressee, TestContext.Current.CancellationToken);

        Assert.Null(resultat);
        Assert.True(File.Exists(CheminDepuisUrl(urlDejaCompressee)));
    }

    [Fact]
    public async Task RecompresserSiNecessaireAsync_UrlExterne_RetourneNull()
    {
        var resultat = await _storage.RecompresserSiNecessaireAsync(
            "https://exemple.test/photo.jpg", TestContext.Current.CancellationToken);

        Assert.Null(resultat);
    }

    [Fact]
    public async Task RecompresserSiNecessaireAsync_FichierIntrouvable_RetourneNull()
    {
        var resultat = await _storage.RecompresserSiNecessaireAsync(
            $"/uploads/{Guid.NewGuid()}.jpg", TestContext.Current.CancellationToken);

        Assert.Null(resultat);
    }

    private string CheminDepuisUrl(string url)
    {
        var nomFichier = url["/uploads/".Length..];
        return Path.Combine(_dossierTest, nomFichier);
    }

    private static void AssertSignatureWebp(byte[] octets)
    {
        Assert.True(octets.Length >= 12);
        Assert.Equal(EnTeteRiff, octets[..4]);
        Assert.Equal(EnTeteWebp, octets[8..12]);
    }

    private static MemoryStream CreerImageJpeg(int largeur, int hauteur)
    {
        using var image = new Image<Rgba32>(largeur, hauteur, Color.CornflowerBlue.ToPixel<Rgba32>());
        var flux = new MemoryStream();
        image.Save(flux, new JpegEncoder());
        flux.Position = 0;
        return flux;
    }

    private static MemoryStream CreerImagePng(int largeur, int hauteur)
    {
        using var image = new Image<Rgba32>(largeur, hauteur, Color.MediumSeaGreen.ToPixel<Rgba32>());
        var flux = new MemoryStream();
        image.Save(flux, new PngEncoder());
        flux.Position = 0;
        return flux;
    }

    private static MemoryStream CreerImageJpegAvecOrientationExif(int largeur, int hauteur, ushort orientationExif)
    {
        using var image = new Image<Rgba32>(largeur, hauteur, Color.Orange.ToPixel<Rgba32>());
        image.Metadata.ExifProfile = new ExifProfile();
        image.Metadata.ExifProfile.SetValue(ExifTag.Orientation, orientationExif);

        var flux = new MemoryStream();
        image.Save(flux, new JpegEncoder());
        flux.Position = 0;
        return flux;
    }
}
