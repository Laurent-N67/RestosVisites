namespace RestosVisites.Domain.Entities;

/// <summary>
/// Un restaurant, identifiable par son nom et son adresse.
/// </summary>
public sealed class Restaurant
{
    public Guid Id { get; }
    public string Nom { get; }
    public string Adresse { get; }

    public Restaurant(string nom, string adresse)
        : this(Guid.NewGuid(), nom, adresse)
    {
    }

    public Restaurant(Guid id, string nom, string adresse)
    {
        if (string.IsNullOrWhiteSpace(nom))
        {
            throw new ArgumentException("Le nom du restaurant ne peut pas être vide.", nameof(nom));
        }

        if (string.IsNullOrWhiteSpace(adresse))
        {
            throw new ArgumentException("L'adresse du restaurant ne peut pas être vide.", nameof(adresse));
        }

        Id = id;
        Nom = nom.Trim();
        Adresse = adresse.Trim();
    }
}
