using Microsoft.EntityFrameworkCore;
using RestosVisites.Application.Abstractions;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Infrastructure.Persistence.Repositories;

public sealed class RestaurantRepository : IRestaurantRepository
{
    private readonly RestosVisitesDbContext _dbContext;

    public RestaurantRepository(RestosVisitesDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AjouterAsync(Restaurant restaurant, CancellationToken ct)
    {
        await _dbContext.Restaurants.AddAsync(restaurant, ct);
        await _dbContext.SaveChangesAsync(ct);
    }

    public async Task<Restaurant?> ObtenirParIdAsync(Guid id, CancellationToken ct)
        => await _dbContext.Restaurants.FirstOrDefaultAsync(r => r.Id == id, ct);

    public async Task<Restaurant?> ObtenirParNomEtAdresseAsync(string nom, string adresse, CancellationToken ct)
        => await _dbContext.Restaurants.FirstOrDefaultAsync(r => r.Nom == nom && r.Adresse == adresse, ct);

    public async Task<IReadOnlyList<Restaurant>> ListerAsync(CancellationToken ct)
        => await _dbContext.Restaurants.AsNoTracking().ToListAsync(ct);
}
