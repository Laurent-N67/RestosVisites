namespace RestosVisites.Domain.ValueObjects;

/// <summary>
/// Note attribuée à une visite, sur une échelle de 1 (très mauvais) à 5 (excellent).
/// </summary>
public sealed record Note
{
    public const int NoteMinimale = 1;
    public const int NoteMaximale = 5;

    public int Valeur { get; }

    public Note(int valeur)
    {
        if (valeur < NoteMinimale || valeur > NoteMaximale)
        {
            throw new ArgumentOutOfRangeException(
                nameof(valeur),
                valeur,
                $"La note doit être comprise entre {NoteMinimale} et {NoteMaximale}.");
        }

        Valeur = valeur;
    }

    public override string ToString() => Valeur.ToString();
}
