using RestosVisites.Application.Abstractions;
using RestosVisites.Application.Exceptions;
using RestosVisites.Domain.Entities;
using RestosVisites.Domain.ValueObjects;

namespace RestosVisites.Application.UseCases.ModifierVisite;

/// <summary>
/// Cas d'usage : modifier une visite existante, en remplaçant entièrement ses photos par la
/// nouvelle liste fournie.
/// </summary>
public sealed class ModifierVisite
{
    private readonly IVisiteRepository _visiteRepository;

    public ModifierVisite(IVisiteRepository visiteRepository)
    {
        _visiteRepository = visiteRepository;
    }

    public async Task ExecuterAsync(ModifierVisiteRequest request, CancellationToken ct = default)
    {
        var visite = await _visiteRepository.ObtenirParIdAsync(request.VisiteId, ct);
        if (visite is null)
        {
            throw new ErreurApplicationException(
                TypeErreurApplication.RessourceNonTrouvee,
                $"Aucune visite trouvée avec l'identifiant '{request.VisiteId}'.");
        }

        var urlsActuelles = visite.Photos.Select(p => p.Url).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var photosASupprimer = visite.Photos
            .Where(p => !request.UrlsPhotos.Contains(p.Url, StringComparer.OrdinalIgnoreCase))
            .ToList();
        foreach (var photo in photosASupprimer)
        {
            visite.SupprimerPhoto(photo.Id);
        }

        foreach (var urlPhoto in request.UrlsPhotos)
        {
            if (urlsActuelles.Add(urlPhoto))
            {
                visite.AjouterPhoto(new Photo(urlPhoto));
            }
        }

        visite.Modifier(request.Date, new Note(request.Note), request.Commentaire);

        await _visiteRepository.MettreAJourAsync(visite, ct);
    }
}
