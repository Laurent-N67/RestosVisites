using RestosVisites.Application.Abstractions;

namespace RestosVisites.Application.Tests.Fakes;

/// <summary>
/// Fake en mémoire de <see cref="IPhotoStorage"/> : ne touche jamais le disque. Le résultat de
/// <see cref="RecompresserSiNecessaireAsync"/> pour une URL donnée est configurable au préalable
/// (absence de configuration => null, simulant une URL externe/déjà en ".webp"/fichier introuvable),
/// et une URL peut être configurée pour lever une exception (simulant un fichier corrompu/illisible).
/// </summary>
public sealed class FakePhotoStorage : IPhotoStorage
{
    private readonly Dictionary<string, PhotoRecompresseeResult> _resultatsParUrl = [];
    private readonly HashSet<string> _urlsEnErreur = [];

    /// <summary>URLs passées à <see cref="RecompresserSiNecessaireAsync"/>, dans l'ordre d'appel.</summary>
    public List<string> UrlsAppelees { get; } = [];

    public Task<string> EnregistrerAsync(Stream contenu, CancellationToken ct)
    {
        throw new NotSupportedException("Non utilisé par les cas d'usage testés via ce fake.");
    }

    /// <summary>Configure le résultat de recompression retourné pour une URL donnée.</summary>
    public void ConfigurerResultat(string url, PhotoRecompresseeResult resultat)
    {
        _resultatsParUrl[url] = resultat;
    }

    /// <summary>Configure une URL pour qu'elle lève une exception lors de la recompression.</summary>
    public void ConfigurerEnErreur(string url)
    {
        _urlsEnErreur.Add(url);
    }

    public Task<PhotoRecompresseeResult?> RecompresserSiNecessaireAsync(string urlActuelle, CancellationToken ct)
    {
        UrlsAppelees.Add(urlActuelle);

        if (_urlsEnErreur.Contains(urlActuelle))
        {
            throw new InvalidOperationException("Fichier corrompu ou illisible (simulation de test).");
        }

        return Task.FromResult(_resultatsParUrl.TryGetValue(urlActuelle, out var resultat) ? resultat : null);
    }
}
