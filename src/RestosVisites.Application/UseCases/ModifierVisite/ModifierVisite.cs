using RestosVisites.Application.Abstractions;
using RestosVisites.Application.Exceptions;
using RestosVisites.Domain.Entities;
using RestosVisites.Domain.ValueObjects;

namespace RestosVisites.Application.UseCases.ModifierVisite;

/// <summary>
/// Cas d'usage : modifier une visite existante, en remplaçant entièrement ses catégories et
/// photos par les nouvelles listes fournies (résolution des catégories par nom, avec
/// réutilisation si elles existent déjà, comme pour <see cref="RestosVisites.Application.UseCases.EnregistrerVisite.EnregistrerVisite"/>).
/// </summary>
public sealed class ModifierVisite
{
    private readonly ICategorieRepository _categorieRepository;
    private readonly IVisiteRepository _visiteRepository;

    public ModifierVisite(ICategorieRepository categorieRepository, IVisiteRepository visiteRepository)
    {
        _categorieRepository = categorieRepository;
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

        var categoriesASupprimer = visite.Categories
            .Where(c => !request.NomsCategories.Contains(c.Nom, StringComparer.OrdinalIgnoreCase))
            .ToList();
        foreach (var categorie in categoriesASupprimer)
        {
            visite.SupprimerCategorie(categorie.Id);
        }

        foreach (var nomCategorie in request.NomsCategories)
        {
            var categorie = await _categorieRepository.ObtenirParNomAsync(nomCategorie, ct);
            if (categorie is null)
            {
                categorie = new Categorie(nomCategorie);
                await _categorieRepository.AjouterAsync(categorie, ct);
            }

            visite.AjouterCategorie(categorie);
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
