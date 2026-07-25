using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace RestosVisites.Infrastructure.Persistence;

/// <summary>
/// Fabrique utilisée par les outils EF Core (dotnet ef) au design-time pour créer le DbContext
/// sans dépendre du projet Api (dont le Program.cs n'enregistre pas encore l'Infrastructure).
/// </summary>
public sealed class RestosVisitesDbContextFactory : IDesignTimeDbContextFactory<RestosVisitesDbContext>
{
    private const string ChaineDeConnexionParDefaut = "Data Source=restosvisites.db";

    public RestosVisitesDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<RestosVisitesDbContext>();
        optionsBuilder.UseSqlite(ChaineDeConnexionParDefaut);

        return new RestosVisitesDbContext(optionsBuilder.Options);
    }
}
