using RestosVisites.Domain.Enums;
using RestosVisites.Domain.ValueObjects;

namespace RestosVisites.Domain.Entities;

/// <summary>
/// Une visite effectuée dans un restaurant : agrégat racine regroupant la date,
/// la note, un commentaire optionnel et les photos associées.
/// </summary>
public sealed class Visite
{
    private readonly List<Photo> _photos = [];

    public Guid Id { get; }
    public Guid RestaurantId { get; }
    public Guid UtilisateurId { get; }
    public DateOnly Date { get; private set; }
    public Note Note { get; private set; }
    public string? Commentaire { get; private set; }
    public Compagnie? AvecQui { get; private set; }
    public Enums.Reservation? Reservation { get; private set; }
    public decimal? Budget { get; private set; }
    public int? TempsAttente { get; private set; }

    public IReadOnlyCollection<Photo> Photos => _photos;

    public Visite(
        Guid restaurantId,
        Guid utilisateurId,
        DateOnly date,
        Note note,
        string? commentaire = null,
        Compagnie? avecQui = null,
        Enums.Reservation? reservation = null,
        decimal? budget = null,
        int? tempsAttente = null)
        : this(Guid.NewGuid(), restaurantId, utilisateurId, date, note, commentaire, avecQui, reservation, budget, tempsAttente)
    {
    }

    public Visite(
        Guid id,
        Guid restaurantId,
        Guid utilisateurId,
        DateOnly date,
        Note note,
        string? commentaire = null,
        Compagnie? avecQui = null,
        Enums.Reservation? reservation = null,
        decimal? budget = null,
        int? tempsAttente = null)
    {
        if (restaurantId == Guid.Empty)
        {
            throw new ArgumentException("L'identifiant du restaurant est obligatoire.", nameof(restaurantId));
        }

        if (utilisateurId == Guid.Empty)
        {
            throw new ArgumentException("L'identifiant de l'utilisateur est obligatoire.", nameof(utilisateurId));
        }

        ArgumentNullException.ThrowIfNull(note);

        if (budget is < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(budget), budget, "Le budget ne peut pas être négatif.");
        }

        if (tempsAttente is < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(tempsAttente), tempsAttente, "Le temps d'attente ne peut pas être négatif.");
        }

        Id = id;
        RestaurantId = restaurantId;
        UtilisateurId = utilisateurId;
        Date = date;
        Note = note;
        Commentaire = string.IsNullOrWhiteSpace(commentaire) ? null : commentaire.Trim();
        AvecQui = avecQui;
        Reservation = reservation;
        Budget = budget;
        TempsAttente = tempsAttente;
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
    /// Retire une photo de la visite. N'a aucun effet si aucune photo avec cet
    /// identifiant n'est associée.
    /// </summary>
    public void SupprimerPhoto(Guid photoId)
    {
        _photos.RemoveAll(p => p.Id == photoId);
    }

    /// <summary>
    /// Modifie la date, la note, le commentaire et les détails de la visite, en appliquant la
    /// même normalisation du commentaire qu'à la création.
    /// </summary>
    public void Modifier(
        DateOnly date,
        Note note,
        string? commentaire,
        Compagnie? avecQui = null,
        Enums.Reservation? reservation = null,
        decimal? budget = null,
        int? tempsAttente = null)
    {
        ArgumentNullException.ThrowIfNull(note);

        if (budget is < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(budget), budget, "Le budget ne peut pas être négatif.");
        }

        if (tempsAttente is < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(tempsAttente), tempsAttente, "Le temps d'attente ne peut pas être négatif.");
        }

        Date = date;
        Note = note;
        Commentaire = string.IsNullOrWhiteSpace(commentaire) ? null : commentaire.Trim();
        AvecQui = avecQui;
        Reservation = reservation;
        Budget = budget;
        TempsAttente = tempsAttente;
    }
}
