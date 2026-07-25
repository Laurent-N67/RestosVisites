namespace RestosVisites.Domain.Entities;

/// <summary>
/// Catégorie de visite (ex : "Italien", "Terrasse"), réutilisable entre plusieurs visites.
/// </summary>
public sealed class Categorie
{
    public Guid Id { get; }
    public string Nom { get; }

    public Categorie(string nom)
        : this(Guid.NewGuid(), nom)
    {
    }

    public Categorie(Guid id, string nom)
    {
        if (string.IsNullOrWhiteSpace(nom))
        {
            throw new ArgumentException("Le nom de la catégorie ne peut pas être vide.", nameof(nom));
        }

        Id = id;
        Nom = nom.Trim();
    }
}
