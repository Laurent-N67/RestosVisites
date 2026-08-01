using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RestosVisites.Application.Abstractions;
using RestosVisites.Infrastructure.Persistence;
using RestosVisites.Infrastructure.Persistence.Repositories;
using RestosVisites.Infrastructure.Storage;

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

    /// <summary>
    /// Enregistre le stockage disque des photos. Le dossier racine est fourni par l'appelant (l'Api)
    /// plutôt que codé en dur ici, afin qu'Infrastructure reste indépendant de la structure du projet hôte.
    /// </summary>
    public static IServiceCollection AddPhotoStorage(this IServiceCollection services, string dossierRacine)
    {
        services.AddSingleton(new PhotoStorageOptions(dossierRacine));
        services.AddSingleton<IPhotoStorage, FichierPhotoStorage>();

        return services;
    }
}
