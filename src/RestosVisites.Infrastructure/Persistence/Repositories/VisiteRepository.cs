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

    public async Task<IReadOnlyList<Visite>> ListerParRestaurantAsync(Guid restaurantId, CancellationToken ct)
        => await _dbContext.Visites
            .AsNoTracking()
            .Include(v => v.Photos)
            .Include(v => v.Categories)
            .Where(v => v.RestaurantId == restaurantId)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Visite>> ListerToutesAsync(CancellationToken ct)
        => await _dbContext.Visites
            .AsNoTracking()
            .Include(v => v.Photos)
            .Include(v => v.Categories)
            .ToListAsync(ct);
}
