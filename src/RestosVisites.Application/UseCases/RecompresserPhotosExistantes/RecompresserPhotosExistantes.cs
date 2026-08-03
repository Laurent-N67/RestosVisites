using RestosVisites.Application.Abstractions;

namespace RestosVisites.Application.UseCases.RecompresserPhotosExistantes;

/// <summary>
/// Cas d'usage de maintenance, réservé aux Admins : recompresse rétroactivement les photos qui
/// n'ont pas encore été prises en charge par le pipeline de compression WebP mis en place le
/// 2026-08-03 (cf. FichierPhotoStorage), c'est-à-dire les photos uploadées avant cette date et
/// encore stockées dans leur format d'origine (souvent des JPEG/PNG volumineux, source de lenteurs
/// sur la liste des restaurants et l'affichage des photos). Parcourt toutes les visites
/// séquentiellement : opération de maintenance ponctuelle, potentiellement sur de nombreux
/// fichiers, sans contrainte de performance justifiant de la parallélisme.
/// </summary>
public sealed class RecompresserPhotosExistantes
{
    private readonly IVisiteRepository _visiteRepository;
    private readonly IPhotoStorage _photoStorage;

    public RecompresserPhotosExistantes(IVisiteRepository visiteRepository, IPhotoStorage photoStorage)
    {
        _visiteRepository = visiteRepository;
        _photoStorage = photoStorage;
    }

    public async Task<RecompresserPhotosExistantesResponse> ExecuterAsync(CancellationToken ct = default)
    {
        // ListerToutesAsync ne sert ici qu'à énumérer les visites/photos à examiner : les entités
        // qu'elle retourne sont potentiellement détachées (cf. VisiteRepository.ListerToutesAsync,
        // en lecture seule via AsNoTracking). Toute mutation destinée à être persistée doit donc être
        // appliquée sur une instance rechargée via ObtenirParIdAsync (le seul chemin garanti "suivi"
        // par le contexte EF, cf. ModifierVisite), jamais directement sur les objets de cette liste.
        var visites = await _visiteRepository.ListerToutesAsync(ct);

        var photosRecompressees = 0;
        var photosEnErreur = 0;
        long tailleAvantOctetsTotale = 0;
        long tailleApresOctetsTotale = 0;

        foreach (var visiteAExaminer in visites)
        {
            var remplacements = new List<(Guid PhotoId, string NouvelleUrl)>();

            foreach (var photo in visiteAExaminer.Photos)
            {
                PhotoRecompresseeResult? resultat;
                try
                {
                    resultat = await _photoStorage.RecompresserSiNecessaireAsync(photo.Url, ct);
                }
                catch (Exception)
                {
                    // Une photo isolée corrompue/illisible ne doit pas interrompre le traitement du
                    // reste du lot : elle est simplement comptabilisée en erreur et ignorée.
                    photosEnErreur++;
                    continue;
                }

                if (resultat is null)
                {
                    continue;
                }

                remplacements.Add((photo.Id, resultat.NouvelleUrl));
                tailleAvantOctetsTotale += resultat.TailleAvantOctets;
                tailleApresOctetsTotale += resultat.TailleApresOctets;
                photosRecompressees++;
            }

            if (remplacements.Count == 0)
            {
                continue;
            }

            // Rechargement via le chemin suivi par EF avant toute mutation destinée à être persistée.
            var visite = await _visiteRepository.ObtenirParIdAsync(visiteAExaminer.Id, ct);
            if (visite is null)
            {
                // Visite supprimée entre l'énumération et le traitement : rien à persister.
                continue;
            }

            foreach (var (photoId, nouvelleUrl) in remplacements)
            {
                var photo = visite.Photos.FirstOrDefault(p => p.Id == photoId);
                photo?.Remplacer(nouvelleUrl);
            }

            await _visiteRepository.MettreAJourAsync(visite, ct);
        }

        return new RecompresserPhotosExistantesResponse(
            photosRecompressees, tailleAvantOctetsTotale, tailleApresOctetsTotale, photosEnErreur);
    }
}
