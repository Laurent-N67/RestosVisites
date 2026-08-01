namespace RestosVisites.Domain.Entities;

/// <summary>
/// Catégorie prédéfinie du catalogue (ex : "Italienne", "Terrasse"), organisée par groupe
/// (ex : "Type de cuisine", "Autres caractéristiques") et attachée à un ou plusieurs restaurants.
/// </summary>
public sealed class Categorie
{
    public Guid Id { get; }
    public string Nom { get; }
    public string Groupe { get; }

    public Categorie(string nom, string groupe)
        : this(Guid.NewGuid(), nom, groupe)
    {
    }

    public Categorie(Guid id, string nom, string groupe)
    {
        if (string.IsNullOrWhiteSpace(nom))
        {
            throw new ArgumentException("Le nom de la catégorie ne peut pas être vide.", nameof(nom));
        }

        if (string.IsNullOrWhiteSpace(groupe))
        {
            throw new ArgumentException("Le groupe de la catégorie ne peut pas être vide.", nameof(groupe));
        }

        Id = id;
        Nom = nom.Trim();
        Groupe = groupe.Trim();
    }
}
