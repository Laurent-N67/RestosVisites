namespace RestosVisites.Domain.Entities;

/// <summary>
/// Référence à une photo associée à une visite. Le Domain ne connaît qu'une
/// référence (URL ou chemin) ; le stockage réel du fichier est hors de son périmètre.
/// </summary>
public sealed class Photo
{
    public Guid Id { get; }
    public string Url { get; }

    public Photo(string url)
        : this(Guid.NewGuid(), url)
    {
    }

    public Photo(Guid id, string url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            throw new ArgumentException("L'URL ou le chemin de la photo ne peut pas être vide.", nameof(url));
        }

        Id = id;
        Url = url.Trim();
    }
}
