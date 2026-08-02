using Microsoft.EntityFrameworkCore;
using RestosVisites.Application.Abstractions;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Infrastructure.Persistence.Repositories;

public sealed class FavoriRestaurantRepository : IFavoriRestaurantRepository
{
    private readonly RestosVisitesDbContext _dbContext;

    public FavoriRestaurantRepository(RestosVisitesDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AjouterAsync(FavoriRestaurant favori, CancellationToken ct)
    {
        await _dbContext.FavorisRestaurants.AddAsync(favori, ct);
        await _dbContext.SaveChangesAsync(ct);
    }

    public async Task<FavoriRestaurant?> ObtenirAsync(Guid utilisateurId, Guid restaurantId, CancellationToken ct)
        => await _dbContext.FavorisRestaurants
            .FirstOrDefaultAsync(f => f.UtilisateurId == utilisateurId && f.RestaurantId == restaurantId, ct);

    public async Task<IReadOnlyList<FavoriRestaurant>> ListerParUtilisateurAsync(Guid utilisateurId, CancellationToken ct)
        => await _dbContext.FavorisRestaurants
            .AsNoTracking()
            .Where(f => f.UtilisateurId == utilisateurId)
            .ToListAsync(ct);

    public async Task SupprimerAsync(Guid utilisateurId, Guid restaurantId, CancellationToken ct)
    {
        var favori = await _dbContext.FavorisRestaurants
            .FirstOrDefaultAsync(f => f.UtilisateurId == utilisateurId && f.RestaurantId == restaurantId, ct);
        if (favori is not null)
        {
            _dbContext.FavorisRestaurants.Remove(favori);
            await _dbContext.SaveChangesAsync(ct);
        }
    }
}
