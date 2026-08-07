namespace RestosVisites.Domain.Entities;

/// <summary>
/// Un restaurant, identifiable par son nom et son adresse, et rattaché à un ensemble de
/// catégories choisies dans le catalogue prédéfini (<see cref="Categorie"/>).
/// </summary>
public sealed class Restaurant
{
    private readonly List<Categorie> _categories = [];
    private readonly List<RestaurantPhoto> _photos = [];

    public Guid Id { get; }
    public string Nom { get; private set; }
    public string Adresse { get; private set; }
    public double Latitude { get; private set; }
    public double Longitude { get; private set; }
    public string? Description { get; private set; }
    public string? Telephone { get; private set; }
    public string? SiteWeb { get; private set; }
    public string? Horaires { get; private set; }

    public IReadOnlyCollection<Categorie> Categories => _categories;
    public IReadOnlyCollection<RestaurantPhoto> Photos => _photos;

    public Restaurant(
        string nom,
        string adresse,
        double latitude,
        double longitude,
        string? description = null,
        string? telephone = null,
        string? siteWeb = null,
        string? horaires = null)
        : this(Guid.NewGuid(), nom, adresse, latitude, longitude, description, telephone, siteWeb, horaires)
    {
    }

    public Restaurant(
        string nom,
        string adresse,
        double latitude,
        double longitude,
        IEnumerable<Categorie> categories,
        string? description = null,
        string? telephone = null,
        string? siteWeb = null,
        string? horaires = null)
        : this(Guid.NewGuid(), nom, adresse, latitude, longitude, categories, description, telephone, siteWeb, horaires)
    {
    }

    // Constructeur utilisé par EF Core au chargement depuis la base (constructor binding) : ses
    // paramètres se limitent volontairement aux propriétés scalaires mappées, une collection
    // navigation comme "categories" ne pouvant pas être liée à un paramètre de constructeur.
    public Restaurant(
        Guid id,
        string nom,
        string adresse,
        double latitude,
        double longitude,
        string? description = null,
        string? telephone = null,
        string? siteWeb = null,
        string? horaires = null)
        : this(id, nom, adresse, latitude, longitude, [], description, telephone, siteWeb, horaires)
    {
    }

    public Restaurant(
        Guid id,
        string nom,
        string adresse,
        double latitude,
        double longitude,
        IEnumerable<Categorie> categories,
        string? description = null,
        string? telephone = null,
        string? siteWeb = null,
        string? horaires = null)
    {
        Valider(nom, adresse, latitude, longitude);

        Id = id;
        Nom = nom.Trim();
        Adresse = adresse.Trim();
        Latitude = latitude;
        Longitude = longitude;
        Description = NormaliserTexteOptionnel(description);
        Telephone = NormaliserTexteOptionnel(telephone);
        SiteWeb = NormaliserTexteOptionnel(siteWeb);
        Horaires = NormaliserTexteOptionnel(horaires);
        DefinirCategories(categories);
    }

    /// <summary>
    /// Modifie les informations du restaurant, en appliquant les mêmes règles de validation
    /// qu'à la création.
    /// </summary>
    public void Modifier(
        string nom,
        string adresse,
        double latitude,
        double longitude,
        string? description = null,
        string? telephone = null,
        string? siteWeb = null,
        string? horaires = null)
    {
        Valider(nom, adresse, latitude, longitude);

        Nom = nom.Trim();
        Adresse = adresse.Trim();
        Latitude = latitude;
        Longitude = longitude;
        Description = NormaliserTexteOptionnel(description);
        Telephone = NormaliserTexteOptionnel(telephone);
        SiteWeb = NormaliserTexteOptionnel(siteWeb);
        Horaires = NormaliserTexteOptionnel(horaires);
    }

    /// <summary>
    /// Remplace entièrement l'ensemble des catégories associées au restaurant par celles fournies
    /// (dédoublonnées par identifiant), le formulaire renvoyant systématiquement l'ensemble complet
    /// des catégories choisies plutôt qu'un ajout/retrait incrémental.
    /// </summary>
    public void DefinirCategories(IEnumerable<Categorie> categories)
    {
        ArgumentNullException.ThrowIfNull(categories);

        _categories.Clear();

        foreach (var categorie in categories)
        {
            if (_categories.Any(c => c.Id == categorie.Id))
            {
                continue;
            }

            _categories.Add(categorie);
        }
    }

    /// <summary>
    /// Ajoute une photo au restaurant, en lui affectant l'ordre d'affichage séquentiel suivant.
    /// Retourne la photo créée, dont l'appelant a besoin de connaître l'identifiant généré.
    /// </summary>
    public RestaurantPhoto AjouterPhoto(string url)
    {
        var ordre = _photos.Count == 0 ? 0 : _photos.Max(p => p.Ordre) + 1;
        var photo = new RestaurantPhoto(url, ordre);

        _photos.Add(photo);

        return photo;
    }

    /// <summary>
    /// Retire une photo du restaurant. N'a aucun effet si aucune photo avec cet
    /// identifiant n'est associée.
    /// </summary>
    public void SupprimerPhoto(Guid photoId)
    {
        _photos.RemoveAll(p => p.Id == photoId);
    }

    /// <summary>
    /// Marque une photo comme principale, en s'assurant qu'au plus une photo du restaurant l'est à
    /// la fois (toute autre photo précédemment principale est démarquée).
    /// </summary>
    public void DefinirPhotoPrincipale(Guid photoId)
    {
        var photo = _photos.FirstOrDefault(p => p.Id == photoId);
        if (photo is null)
        {
            throw new ArgumentException($"Aucune photo trouvée avec l'identifiant '{photoId}'.", nameof(photoId));
        }

        foreach (var autrePhoto in _photos)
        {
            autrePhoto.EstPrincipale = autrePhoto.Id == photoId;
        }
    }

    private static string? NormaliserTexteOptionnel(string? valeur)
        => string.IsNullOrWhiteSpace(valeur) ? null : valeur.Trim();

    private static void Valider(string nom, string adresse, double latitude, double longitude)
    {
        if (string.IsNullOrWhiteSpace(nom))
        {
            throw new ArgumentException("Le nom du restaurant ne peut pas être vide.", nameof(nom));
        }

        if (string.IsNullOrWhiteSpace(adresse))
        {
            throw new ArgumentException("L'adresse du restaurant ne peut pas être vide.", nameof(adresse));
        }

        if (latitude is < -90 or > 90)
        {
            throw new ArgumentOutOfRangeException(nameof(latitude), latitude, "La latitude doit être comprise entre -90 et 90.");
        }

        if (longitude is < -180 or > 180)
        {
            throw new ArgumentOutOfRangeException(nameof(longitude), longitude, "La longitude doit être comprise entre -180 et 180.");
        }
    }
}
