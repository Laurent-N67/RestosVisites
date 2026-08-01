using RestosVisites.Application.Abstractions;
using RestosVisites.Application.UseCases.ListerVisitesRestaurant;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Application.UseCases.ListerToutesLesVisites;

/// <summary>
/// Cas d'usage : lister l'ensemble des visites, tous restaurants confondus.
/// </summary>
public sealed class ListerToutesLesVisites
{
    private readonly IVisiteRepository _visiteRepository;

    public ListerToutesLesVisites(IVisiteRepository visiteRepository)
    {
        _visiteRepository = visiteRepository;
    }

    public async Task<IReadOnlyList<VisiteDto>> ExecuterAsync(CancellationToken ct = default)
    {
        var visites = await _visiteRepository.ListerToutesAsync(ct);

        return visites.Select(VersDto).ToList();
    }

    private static VisiteDto VersDto(Visite visite) => new(
        visite.Id,
        visite.RestaurantId,
        visite.Date,
        visite.Note.Valeur,
        visite.Commentaire,
        visite.Categories.Select(c => c.Nom).ToList(),
        visite.Photos.Select(p => p.Url).ToList());
}
