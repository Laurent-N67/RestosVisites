namespace RestosVisites.Infrastructure.Storage;

/// <summary>
/// Options de configuration du stockage disque des photos. Le dossier racine est fourni par l'Api
/// (via <c>AddPhotoStorage</c>) afin qu'Infrastructure ne code jamais en dur un chemin dépendant du
/// projet hôte (respect du sens de dépendance de la Clean Architecture).
/// </summary>
/// <param name="DossierRacine">Chemin absolu du dossier dans lequel les fichiers sont écrits.</param>
public sealed record PhotoStorageOptions(string DossierRacine);
