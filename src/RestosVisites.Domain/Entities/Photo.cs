namespace RestosVisites.Domain.Entities;

/// <summary>
/// Référence à une photo associée à une visite. Le Domain ne connaît qu'une
/// référence (URL ou chemin) ; le stockage réel du fichier est hors de son périmètre.
/// </summary>
public sealed class Photo
{
    public Guid Id { get; }
    public string Url { get; private set; }

    public Photo(string url)
        : this(Guid.NewGuid(), url)
    {
    }

    public Photo(Guid id, string url)
    {
        ValiderUrl(url);

        Id = id;
        Url = url.Trim();
    }

    /// <summary>
    /// Remplace l'URL de la photo (ex : recompression rétroactive d'une photo existante vers un
    /// nouveau fichier WebP, cf. RecompresserPhotosExistantes).
    /// </summary>
    public void Remplacer(string nouvelleUrl)
    {
        ValiderUrl(nouvelleUrl);

        Url = nouvelleUrl.Trim();
    }

    private static void ValiderUrl(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            throw new ArgumentException("L'URL ou le chemin de la photo ne peut pas être vide.", nameof(url));
        }
    }
}
