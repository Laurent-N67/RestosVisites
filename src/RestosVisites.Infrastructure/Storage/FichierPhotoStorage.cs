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

        return await CompresserEtEcrireAsync(image, ct);
    }

    public async Task<PhotoRecompresseeResult?> RecompresserSiNecessaireAsync(string urlActuelle, CancellationToken ct)
    {
        if (!urlActuelle.StartsWith($"{CheminUrlPublic}/", StringComparison.Ordinal))
        {
            // URL externe collée par l'utilisateur, pas un fichier géré par ce stockage : rien à faire.
            return null;
        }

        if (urlActuelle.EndsWith(".webp", StringComparison.OrdinalIgnoreCase))
        {
            // Déjà passée par le pipeline de compression (upload récent, ou déjà recompressée) : c'est
            // le seul filtre distinguant les photos historiques (pré-2026-08-03) des autres.
            return null;
        }

        var cheminComplet = ResoudreCheminSecurise(urlActuelle);
        if (cheminComplet is null || !File.Exists(cheminComplet))
        {
            // Fichier introuvable : on ignore silencieusement plutôt que d'échouer, les données
            // historiques pouvant présenter des trous (photo supprimée manuellement du disque, etc.).
            return null;
        }

        var tailleAvantOctets = new FileInfo(cheminComplet).Length;

        string nouvelleUrl;
        using (var image = await Image.LoadAsync(cheminComplet, ct))
        {
            nouvelleUrl = await CompresserEtEcrireAsync(image, ct);
        }

        var nouveauCheminComplet = Path.Combine(_options.DossierRacine, nouvelleUrl[(CheminUrlPublic.Length + 1)..]);
        var tailleApresOctets = new FileInfo(nouveauCheminComplet).Length;

        // Le nouveau fichier n'est supprimé qu'une fois le nouveau écrit avec succès, pour ne jamais
        // perdre la photo d'origine si l'encodage échoue en cours de route.
        File.Delete(cheminComplet);

        return new PhotoRecompresseeResult(nouvelleUrl, tailleAvantOctets, tailleApresOctets);
    }

    /// <summary>
    /// Résout le chemin physique correspondant à une URL "/uploads/..." et vérifie qu'il reste
    /// directement contenu dans <see cref="PhotoStorageOptions.DossierRacine"/> (défense en profondeur
    /// contre un nom de fichier "en forme de" traversée de chemin, même si ces URLs sont nos propres
    /// données en base et non une entrée utilisateur à cet appel). Compare les chemins complets
    /// résolus plutôt qu'un simple préfixe de chaîne, pour éviter un faux négatif avec un dossier
    /// voisin au nom similaire (ex: "DossierRacine-autre").
    /// </summary>
    private string? ResoudreCheminSecurise(string url)
    {
        var nomFichierRelatif = url[(CheminUrlPublic.Length + 1)..];
        var dossierRacineComplet = Path.GetFullPath(_options.DossierRacine);
        var cheminComplet = Path.GetFullPath(Path.Combine(dossierRacineComplet, nomFichierRelatif));

        var estDansLeDossierRacine = cheminComplet == dossierRacineComplet
            || cheminComplet.StartsWith(dossierRacineComplet + Path.DirectorySeparatorChar, StringComparison.Ordinal);

        return estDansLeDossierRacine ? cheminComplet : null;
    }

    /// <summary>
    /// Pipeline partagé de compression/optimisation (AutoOrient, redimensionnement conditionnel,
    /// ré-encodage WebP) : écrit un nouveau fichier "{Guid}.webp" dans le dossier racine et retourne
    /// son URL relative. Utilisé aussi bien pour un nouvel upload (<see cref="EnregistrerAsync"/>) que
    /// pour la recompression rétroactive d'un fichier déjà sur disque (<see cref="RecompresserSiNecessaireAsync"/>).
    /// </summary>
    private async Task<string> CompresserEtEcrireAsync(Image image, CancellationToken ct)
    {
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
