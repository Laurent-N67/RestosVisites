using RestosVisites.Application.Abstractions;

namespace RestosVisites.Infrastructure.Storage;

/// <summary>
/// Implémentation disque de <see cref="IPhotoStorage"/> : écrit le fichier dans
/// <see cref="PhotoStorageOptions.DossierRacine"/> sous un nom généré aléatoirement (jamais le nom
/// fourni par l'utilisateur, afin d'éviter collisions, caractères spéciaux et path traversal), et
/// retourne l'URL relative sous "/uploads" à laquelle le fichier statique sera servi par l'Api.
/// </summary>
public sealed class FichierPhotoStorage : IPhotoStorage
{
    private const string CheminUrlPublic = "/uploads";

    private readonly PhotoStorageOptions _options;

    public FichierPhotoStorage(PhotoStorageOptions options)
    {
        _options = options;
    }

    public async Task<string> EnregistrerAsync(Stream contenu, string extensionFichier, CancellationToken ct)
    {
        Directory.CreateDirectory(_options.DossierRacine);

        var nomFichier = $"{Guid.NewGuid()}{extensionFichier}";
        var cheminComplet = Path.Combine(_options.DossierRacine, nomFichier);

        await using (var fichier = new FileStream(cheminComplet, FileMode.CreateNew, FileAccess.Write))
        {
            await contenu.CopyToAsync(fichier, ct);
        }

        return $"{CheminUrlPublic}/{nomFichier}";
    }
}
