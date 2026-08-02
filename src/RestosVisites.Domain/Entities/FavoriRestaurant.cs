namespace RestosVisites.Domain.Entities;

/// <summary>
/// Association entre un utilisateur et l'un de ses restaurants favoris, datée de son ajout.
/// La règle métier "6 favoris maximum par utilisateur" n'est pas vérifiée ici : elle dépend de
/// l'état de l'ensemble des favoris de l'utilisateur, donc elle est du ressort du cas d'usage
/// Application (<c>AjouterFavori</c>), pas d'une seule instance de cette entité.
/// </summary>
public sealed class FavoriRestaurant
{
    public Guid Id { get; }
    public Guid UtilisateurId { get; }
    public Guid RestaurantId { get; }
    public DateTimeOffset DateAjout { get; }

    public FavoriRestaurant(Guid utilisateurId, Guid restaurantId, DateTimeOffset dateAjout)
        : this(Guid.NewGuid(), utilisateurId, restaurantId, dateAjout)
    {
    }

    public FavoriRestaurant(Guid id, Guid utilisateurId, Guid restaurantId, DateTimeOffset dateAjout)
    {
        Valider(utilisateurId, restaurantId);

        Id = id;
        UtilisateurId = utilisateurId;
        RestaurantId = restaurantId;
        DateAjout = dateAjout;
    }

    private static void Valider(Guid utilisateurId, Guid restaurantId)
    {
        if (utilisateurId == Guid.Empty)
        {
            throw new ArgumentException("L'identifiant de l'utilisateur est obligatoire.", nameof(utilisateurId));
        }

        if (restaurantId == Guid.Empty)
        {
            throw new ArgumentException("L'identifiant du restaurant est obligatoire.", nameof(restaurantId));
        }
    }
}
