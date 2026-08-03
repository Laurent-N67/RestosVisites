namespace RestosVisites.Application.Abstractions;

/// <summary>
/// Résultat d'une recompression rétroactive réussie d'une photo existante, cf.
/// <see cref="IPhotoStorage.RecompresserSiNecessaireAsync"/>.
/// </summary>
/// <param name="NouvelleUrl">URL relative (ex: "/uploads/{guid}.webp") du nouveau fichier écrit sur disque.</param>
/// <param name="TailleAvantOctets">Taille en octets du fichier d'origine, avant recompression.</param>
/// <param name="TailleApresOctets">Taille en octets du nouveau fichier WebP, après recompression.</param>
public sealed record PhotoRecompresseeResult(string NouvelleUrl, long TailleAvantOctets, long TailleApresOctets);
