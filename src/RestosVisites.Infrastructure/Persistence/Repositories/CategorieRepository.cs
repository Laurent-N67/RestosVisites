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

    public async Task<Categorie?> ObtenirParNomAsync(string nom, CancellationToken ct)
        => await _dbContext.Categories.FirstOrDefaultAsync(c => c.Nom == nom, ct);

    public async Task AjouterAsync(Categorie categorie, CancellationToken ct)
    {
        await _dbContext.Categories.AddAsync(categorie, ct);
        await _dbContext.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<Categorie>> ListerAsync(CancellationToken ct)
        => await _dbContext.Categories.AsNoTracking().ToListAsync(ct);
}
