using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RestosVisites.Application.Abstractions;
using RestosVisites.Infrastructure.Persistence;
using RestosVisites.Infrastructure.Persistence.Repositories;

namespace RestosVisites.Infrastructure;

/// <summary>
/// Point d'entrée pour l'enregistrement des services d'infrastructure (persistance SQLite/EF Core).
/// </summary>
public static class DependencyInjection
{
    private const string NomChaineDeConnexion = "RestosVisites";
    private const string ChaineDeConnexionParDefaut = "Data Source=restosvisites.db";

    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var chaineDeConnexion = configuration.GetConnectionString(NomChaineDeConnexion) ?? ChaineDeConnexionParDefaut;

        services.AddDbContext<RestosVisitesDbContext>(options => options.UseSqlite(chaineDeConnexion));

        services.AddScoped<IRestaurantRepository, RestaurantRepository>();
        services.AddScoped<ICategorieRepository, CategorieRepository>();
        services.AddScoped<IVisiteRepository, VisiteRepository>();

        return services;
    }
}
