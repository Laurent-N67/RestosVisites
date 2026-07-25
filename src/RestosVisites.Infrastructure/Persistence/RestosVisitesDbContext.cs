using Microsoft.EntityFrameworkCore;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Infrastructure.Persistence;

/// <summary>
/// Contexte EF Core de l'application, persistant les restaurants, visites et catégories via SQLite.
/// </summary>
public sealed class RestosVisitesDbContext : DbContext
{
    public RestosVisitesDbContext(DbContextOptions<RestosVisitesDbContext> options)
        : base(options)
    {
    }

    public DbSet<Restaurant> Restaurants => Set<Restaurant>();

    public DbSet<Visite> Visites => Set<Visite>();

    public DbSet<Categorie> Categories => Set<Categorie>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(RestosVisitesDbContext).Assembly);
    }
}
