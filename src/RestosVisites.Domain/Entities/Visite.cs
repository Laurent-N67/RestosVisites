using RestosVisites.Domain.ValueObjects;

namespace RestosVisites.Domain.Entities;

/// <summary>
/// Une visite effectuée dans un restaurant : agrégat racine regroupant la date,
/// la note, un commentaire optionnel, les photos et les catégories associées.
/// </summary>
public sealed class Visite
{
    private readonly List<Photo> _photos = [];
    private readonly List<Categorie> _categories = [];

    public Guid Id { get; }
    public Guid RestaurantId { get; }
    public DateOnly Date { get; private set; }
    public Note Note { get; private set; }
    public string? Commentaire { get; private set; }

    public IReadOnlyCollection<Photo> Photos => _photos;
    public IReadOnlyCollection<Categorie> Categories => _categories;

    public Visite(Guid restaurantId, DateOnly date, Note note, string? commentaire = null)
        : this(Guid.NewGuid(), restaurantId, date, note, commentaire)
    {
    }

    public Visite(Guid id, Guid restaurantId, DateOnly date, Note note, string? commentaire = null)
    {
        if (restaurantId == Guid.Empty)
        {
            throw new ArgumentException("L'identifiant du restaurant est obligatoire.", nameof(restaurantId));
        }

        ArgumentNullException.ThrowIfNull(note);

        Id = id;
        RestaurantId = restaurantId;
        Date = date;
        Note = note;
        Commentaire = string.IsNullOrWhiteSpace(commentaire) ? null : commentaire.Trim();
    }

    /// <summary>
    /// Ajoute une photo à la visite. N'a aucun effet si une photo avec le même
    /// identifiant est déjà associée.
    /// </summary>
    public void AjouterPhoto(Photo photo)
    {
        ArgumentNullException.ThrowIfNull(photo);

        if (_photos.Any(p => p.Id == photo.Id))
        {
            return;
        }

        _photos.Add(photo);
    }

    /// <summary>
    /// Associe une catégorie à la visite. N'a aucun effet si la catégorie est
    /// déjà associée (même identifiant).
    /// </summary>
    public void AjouterCategorie(Categorie categorie)
    {
        ArgumentNullException.ThrowIfNull(categorie);

        if (_categories.Any(c => c.Id == categorie.Id))
        {
            return;
        }

        _categories.Add(categorie);
    }

    /// <summary>
    /// Retire une photo de la visite. N'a aucun effet si aucune photo avec cet
    /// identifiant n'est associée.
    /// </summary>
    public void SupprimerPhoto(Guid photoId)
    {
        _photos.RemoveAll(p => p.Id == photoId);
    }

    /// <summary>
    /// Dissocie une catégorie de la visite. N'a aucun effet si aucune catégorie avec cet
    /// identifiant n'est associée.
    /// </summary>
    public void SupprimerCategorie(Guid categorieId)
    {
        _categories.RemoveAll(c => c.Id == categorieId);
    }

    /// <summary>
    /// Modifie la date, la note et le commentaire de la visite, en appliquant la même
    /// normalisation du commentaire qu'à la création.
    /// </summary>
    public void Modifier(DateOnly date, Note note, string? commentaire)
    {
        ArgumentNullException.ThrowIfNull(note);

        Date = date;
        Note = note;
        Commentaire = string.IsNullOrWhiteSpace(commentaire) ? null : commentaire.Trim();
    }
}
