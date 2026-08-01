using RestosVisites.Application.Abstractions;
using RestosVisites.Application.Exceptions;

namespace RestosVisites.Application.UseCases.SupprimerVisite;

/// <summary>
/// Cas d'usage : supprimer une visite existante.
/// </summary>
public sealed class SupprimerVisite
{
    private readonly IVisiteRepository _visiteRepository;

    public SupprimerVisite(IVisiteRepository visiteRepository)
    {
        _visiteRepository = visiteRepository;
    }

    public async Task ExecuterAsync(SupprimerVisiteRequest request, CancellationToken ct = default)
    {
        var visite = await _visiteRepository.ObtenirParIdAsync(request.VisiteId, ct);
        if (visite is null)
        {
            throw new ErreurApplicationException(
                TypeErreurApplication.RessourceNonTrouvee,
                $"Aucune visite trouvée avec l'identifiant '{request.VisiteId}'.");
        }

        await _visiteRepository.SupprimerAsync(request.VisiteId, ct);
    }
}
