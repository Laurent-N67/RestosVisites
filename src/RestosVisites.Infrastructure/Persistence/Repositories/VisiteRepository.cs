using Microsoft.EntityFrameworkCore;
using RestosVisites.Application.Abstractions;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Infrastructure.Persistence.Repositories;

public sealed class VisiteRepository : IVisiteRepository
{
    private readonly RestosVisitesDbContext _dbContext;

    public VisiteRepository(RestosVisitesDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AjouterAsync(Visite visite, CancellationToken ct)
    {
        await _dbContext.Visites.AddAsync(visite, ct);
        await _dbContext.SaveChangesAsync(ct);
    }

    public async Task<Visite?> ObtenirParIdAsync(Guid id, CancellationToken ct)
        => await _dbContext.Visites
            .Include(v => v.Photos)
            .FirstOrDefaultAsync(v => v.Id == id, ct);

    public async Task<IReadOnlyList<Visite>> ListerParRestaurantAsync(Guid restaurantId, CancellationToken ct)
        => await _dbContext.Visites
            .AsNoTracking()
            .Include(v => v.Photos)
            .Where(v => v.RestaurantId == restaurantId)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Visite>> ListerToutesAsync(CancellationToken ct)
        => await _dbContext.Visites
            .AsNoTracking()
            .Include(v => v.Photos)
            .ToListAsync(ct);

    /// <summary>
    /// Persiste les modifications d'une visite déjà suivie par le contexte (obtenue via
    /// <see cref="ObtenirParIdAsync"/>) : les changements sur ses propriétés ainsi que sur sa
    /// collection de photos sont détectés automatiquement par EF Core.
    /// </summary>
    public async Task MettreAJourAsync(Visite visite, CancellationToken ct)
    {
        await _dbContext.SaveChangesAsync(ct);
    }

    public async Task SupprimerAsync(Guid id, CancellationToken ct)
    {
        var visite = await _dbContext.Visites.FindAsync([id], ct);
        if (visite is not null)
        {
            _dbContext.Visites.Remove(visite);
            await _dbContext.SaveChangesAsync(ct);
        }
    }
}
