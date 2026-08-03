namespace RestosVisites.Application.UseCases.RecompresserPhotosExistantes;

/// <summary>Résumé de l'opération de recompression rétroactive des photos existantes.</summary>
/// <param name="PhotosRecompressees">Nombre de photos effectivement recompressées et persistées.</param>
/// <param name="TailleAvantOctetsTotale">Somme des tailles d'origine des photos recompressées, en octets.</param>
/// <param name="TailleApresOctetsTotale">Somme des tailles après recompression des photos recompressées, en octets.</param>
/// <param name="PhotosEnErreur">Nombre de photos dont le traitement a échoué (fichier corrompu/illisible), ignorées sans interrompre le reste du traitement.</param>
public sealed record RecompresserPhotosExistantesResponse(
    int PhotosRecompressees,
    long TailleAvantOctetsTotale,
    long TailleApresOctetsTotale,
    int PhotosEnErreur);
