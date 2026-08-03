namespace RestosVisites.Application.Abstractions;

/// <summary>
/// Port de stockage des fichiers image envoyés par l'utilisateur (upload direct, par opposition
/// au simple collage d'une URL externe). L'implémentation décide de l'emplacement physique du
/// fichier ; ce port ne retourne que l'URL relative permettant de le récupérer ensuite via HTTP.
/// </summary>
public interface IPhotoStorage
{
    /// <summary>
    /// Enregistre le contenu binaire d'une photo et retourne l'URL relative (ex: "/uploads/{guid}.webp")
    /// à laquelle le fichier stocké sera accessible. L'implémentation compresse/ré-encode systématiquement
    /// l'image en WebP avant de l'écrire sur disque (quel que soit le format d'entrée, déjà validé en
    /// amont par l'appelant) : il n'y a donc plus d'extension à faire transiter par l'appelant.
    /// </summary>
    /// <param name="contenu">Flux du contenu binaire de l'image (JPEG, PNG ou WebP, déjà validé par l'appelant).</param>
    Task<string> EnregistrerAsync(Stream contenu, CancellationToken ct);

    /// <summary>
    /// Retourne l'URL déjà locale, non recompressée par le pipeline (issue d'un upload antérieur au
    /// 2026-08-03) : recompresse le fichier existant vers WebP via le même pipeline que <see cref="EnregistrerAsync"/>,
    /// remplace le fichier physique, et retourne la nouvelle URL. Retourne null si l'URL ne pointe pas vers un
    /// fichier géré par ce stockage (URL externe collée par l'utilisateur), si le fichier référencé est introuvable,
    /// ou si l'URL pointe déjà vers un fichier ".webp" (déjà recompressé, rien à faire).
    /// </summary>
    Task<PhotoRecompresseeResult?> RecompresserSiNecessaireAsync(string urlActuelle, CancellationToken ct);
}
