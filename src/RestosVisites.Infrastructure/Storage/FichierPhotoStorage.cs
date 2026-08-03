using RestosVisites.Application.Abstractions;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace RestosVisites.Infrastructure.Storage;

/// <summary>
/// Implémentation disque de <see cref="IPhotoStorage"/> : décode l'image reçue (déjà validée en amont
/// par l'appelant), la recompresse (redimensionnement + ré-encodage WebP) puis l'écrit dans
/// <see cref="PhotoStorageOptions.DossierRacine"/> sous un nom généré aléatoirement (jamais le nom
/// fourni par l'utilisateur, afin d'éviter collisions, caractères spéciaux et path traversal), et
/// retourne l'URL relative sous "/uploads" à laquelle le fichier statique sera servi par l'Api.
/// </summary>
public sealed class FichierPhotoStorage : IPhotoStorage
{
    private const string CheminUrlPublic = "/uploads";

    // Plus grande dimension autorisée après redimensionnement (l'autre dimension est calculée pour
    // préserver le ratio d'aspect) ; suffisant pour un affichage plein écran sur la quasi-totalité
    // des appareils, tout en réduisant nettement le poids des photos de téléphone (souvent 3000-4000px
    // de côté).
    private const int DimensionMaxPixels = 1920;

    // Qualité de compression WebP avec perte (0-100) : bon compromis poids/qualité visuelle pour des
    // photos de restaurant, pas affiné au-delà de cette valeur de départ raisonnable.
    private const int QualiteWebp = 82;

    private readonly PhotoStorageOptions _options;

    public FichierPhotoStorage(PhotoStorageOptions options)
    {
        _options = options;
    }

    public async Task<string> EnregistrerAsync(Stream contenu, CancellationToken ct)
    {
        Directory.CreateDirectory(_options.DossierRacine);

        using var image = await Image.LoadAsync(contenu, ct);

        // Les photos de téléphone portent l'orientation réelle dans les métadonnées EXIF plutôt que
        // dans l'agencement physique des pixels ; ImageSharp ne l'applique PAS automatiquement au
        // chargement. Sans cet appel explicite, une photo prise en portrait mais stockée avec un tag
        // EXIF "rotation 90°" ressortirait de travers une fois ré-encodée (l'orientation d'origine
        // serait perdue). Doit impérativement s'exécuter avant la vérification des dimensions
        // ci-dessous (qui doit porter sur l'orientation finale) et avant l'encodage.
        image.Mutate(x => x.AutoOrient());

        // ResizeMode.Max contraint la plus grande dimension à DimensionMaxPixels en préservant le
        // ratio d'aspect (quelle que soit l'orientation portrait/paysage) — MAIS, contrairement à ce
        // que sa documentation pourrait laisser penser, il agrandit aussi une image plus petite que la
        // boîte cible plutôt que de la laisser telle quelle (vérifié empiriquement, contrairement à
        // ResizeMode.Min qui documente explicitement l'absence d'agrandissement). Il faut donc exclure
        // nous-mêmes le redimensionnement quand l'image est déjà dans les limites, pour ne jamais
        // agrandir une petite photo.
        if (image.Width > DimensionMaxPixels || image.Height > DimensionMaxPixels)
        {
            image.Mutate(x => x.Resize(new ResizeOptions
            {
                Mode = ResizeMode.Max,
                Size = new Size(DimensionMaxPixels, DimensionMaxPixels),
            }));
        }

        // Le fichier stocké est systématiquement ré-encodé en WebP, quel que soit le format d'entrée
        // (JPEG/PNG/WebP, déjà validé par l'appelant) : l'extension n'est donc plus déterminée par le
        // type d'entrée, elle est fixe.
        var nomFichier = $"{Guid.NewGuid()}.webp";
        var cheminComplet = Path.Combine(_options.DossierRacine, nomFichier);

        var encodeur = new WebpEncoder { Quality = QualiteWebp };
        await using (var fichier = new FileStream(cheminComplet, FileMode.CreateNew, FileAccess.Write))
        {
            await image.SaveAsync(fichier, encodeur, ct);
        }

        return $"{CheminUrlPublic}/{nomFichier}";
    }
}
