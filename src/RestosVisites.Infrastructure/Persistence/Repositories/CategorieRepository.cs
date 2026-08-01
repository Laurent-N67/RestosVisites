using Microsoft.EntityFrameworkCore;
using RestosVisites.Application.Abstractions;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Infrastructure.Persistence.Repositories;

public sealed class CategorieRepository : ICategorieRepository
{
    private readonly RestosVisitesDbContext _dbContext;

    public CategorieRepository(RestosVisitesDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Categorie?> ObtenirParIdAsync(Guid id, CancellationToken ct)
        => await _dbContext.Categories.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<IReadOnlyList<Categorie>> ListerAsync(CancellationToken ct)
        => await _dbContext.Categories.AsNoTracking().ToListAsync(ct);
}
