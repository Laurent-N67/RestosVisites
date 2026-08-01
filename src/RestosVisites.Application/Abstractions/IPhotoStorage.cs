namespace RestosVisites.Application.Abstractions;

/// <summary>
/// Port de stockage des fichiers image envoyés par l'utilisateur (upload direct, par opposition
/// au simple collage d'une URL externe). L'implémentation décide de l'emplacement physique du
/// fichier ; ce port ne retourne que l'URL relative permettant de le récupérer ensuite via HTTP.
/// </summary>
public interface IPhotoStorage
{
    /// <summary>
    /// Enregistre le contenu binaire d'une photo et retourne l'URL relative (ex: "/uploads/{guid}.jpg")
    /// à laquelle le fichier stocké sera accessible.
    /// </summary>
    /// <param name="contenu">Flux du contenu binaire de l'image.</param>
    /// <param name="extensionFichier">Extension à utiliser pour le fichier stocké (ex: ".jpg"), déterminée
    /// à partir du type réel du contenu, jamais à partir du nom de fichier fourni par l'utilisateur.</param>
    Task<string> EnregistrerAsync(Stream contenu, string extensionFichier, CancellationToken ct);
}
