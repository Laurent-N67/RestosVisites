namespace RestosVisites.Domain.Entities;

/// <summary>
/// Une photo associée à un restaurant (par opposition aux photos d'une <see cref="Visite"/>) :
/// au plus une photo par restaurant peut être marquée comme principale, et chaque photo possède un
/// ordre d'affichage séquentiel décidé par le <see cref="Restaurant"/> qui la possède.
/// </summary>
public sealed class RestaurantPhoto
{
    public Guid Id { get; }
    public string Url { get; }

    // Setters internes : seul Restaurant (même assembly) doit pouvoir faire évoluer ces deux
    // propriétés après création, afin de garantir l'invariant "au plus une photo principale".
    public bool EstPrincipale { get; internal set; }
    public int Ordre { get; internal set; }

    public RestaurantPhoto(string url, int ordre)
        : this(Guid.NewGuid(), url, false, ordre)
    {
    }

    // Constructeur utilisé par EF Core au chargement depuis la base (constructor binding), et par
    // le constructeur public ci-dessus pour la création d'une nouvelle photo.
    public RestaurantPhoto(Guid id, string url, bool estPrincipale, int ordre)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            throw new ArgumentException("L'URL de la photo ne peut pas être vide.", nameof(url));
        }

        Id = id;
        Url = url.Trim();
        EstPrincipale = estPrincipale;
        Ordre = ordre;
    }
}
