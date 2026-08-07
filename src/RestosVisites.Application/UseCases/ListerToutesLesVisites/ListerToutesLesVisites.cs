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
    private readonly IUtilisateurRepository _utilisateurRepository;

    public ListerToutesLesVisites(IVisiteRepository visiteRepository, IUtilisateurRepository utilisateurRepository)
    {
        _visiteRepository = visiteRepository;
        _utilisateurRepository = utilisateurRepository;
    }

    public async Task<IReadOnlyList<VisiteDto>> ExecuterAsync(CancellationToken ct = default)
    {
        var visites = await _visiteRepository.ListerToutesAsync(ct);
        var utilisateurs = await _utilisateurRepository.ListerAsync(ct);
        var nomsParUtilisateur = utilisateurs.ToDictionary(u => u.Id, u => u.NomAffiche);

        return visites.Select(v => VersDto(v, nomsParUtilisateur)).ToList();
    }

    private static VisiteDto VersDto(Visite visite, IReadOnlyDictionary<Guid, string> nomsParUtilisateur) => new(
        visite.Id,
        visite.RestaurantId,
        visite.UtilisateurId,
        nomsParUtilisateur.TryGetValue(visite.UtilisateurId, out var nom) ? nom : "Utilisateur inconnu",
        visite.Date,
        visite.Note.Valeur,
        visite.Commentaire,
        visite.Photos.Select(p => p.Url).ToList(),
        visite.AvecQui,
        visite.Reservation,
        visite.Budget,
        visite.TempsAttente);
}
