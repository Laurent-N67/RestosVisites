namespace RestosVisites.Domain.Entities;

/// <summary>
/// Un restaurant, identifiable par son nom et son adresse.
/// </summary>
public sealed class Restaurant
{
    public Guid Id { get; }
    public string Nom { get; }
    public string Adresse { get; }
    public double Latitude { get; }
    public double Longitude { get; }

    public Restaurant(string nom, string adresse, double latitude, double longitude)
        : this(Guid.NewGuid(), nom, adresse, latitude, longitude)
    {
    }

    public Restaurant(Guid id, string nom, string adresse, double latitude, double longitude)
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

        Id = id;
        Nom = nom.Trim();
        Adresse = adresse.Trim();
        Latitude = latitude;
        Longitude = longitude;
    }
}
