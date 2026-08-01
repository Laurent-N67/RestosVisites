using System.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RestosVisites.Domain.Entities;
using RestosVisites.Infrastructure.Persistence;
using RestosVisites.Infrastructure.Persistence.Seed;

namespace RestosVisites.Api.Tests;

/// <summary>
/// Factory de test personnalisée : remplace la persistance SQLite fichier par une connexion
/// SQLite en mémoire dédiée, gardée ouverte pendant toute la durée de vie de la factory (donc
/// partagée entre toutes les requêtes HTTP émises par les tests d'une même classe, puisque xUnit
/// crée une seule instance de factory par classe via <see cref="IClassFixture{TFixture}"/>).
///
/// Le schéma est créé explicitement ici (et non via le bloc "if (app.Environment.IsDevelopment())"
/// de Program.cs), afin de fonctionner même si l'environnement de test n'est pas "Development".
/// </summary>
public sealed class RestosVisitesWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _connection = new("Data Source=:memory:");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            var dbContextOptionsDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<RestosVisitesDbContext>));
            if (dbContextOptionsDescriptor is not null)
            {
                services.Remove(dbContextOptionsDescriptor);
            }

            // ConfigureWebHost peut être invoqué plusieurs fois par WebApplicationFactory (ex :
            // premier accès à .Services puis re-création lors du premier CreateClient()) : ouvrir
            // la connexion et repeupler le catalogue à chaque fois romprait (connexion déjà ouverte,
            // doublons de catégories), donc idempotence explicite ci-dessous.
            if (_connection.State != ConnectionState.Open)
            {
                _connection.Open();
            }

            services.AddDbContext<RestosVisitesDbContext>(options => options.UseSqlite(_connection));

            // Crée le schéma immédiatement, sans dépendre du pipeline de Program.cs : garantit que
            // la base de test est prête dès la première requête, quel que soit l'environnement.
            using var serviceProvider = services.BuildServiceProvider();
            using var scope = serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<RestosVisitesDbContext>();
            dbContext.Database.EnsureCreated();

            // EnsureCreated() ne rejoue pas les migrations (donc pas l'InsertData du catalogue de
            // catégories) : on repeuple ici le même catalogue, avec les mêmes Ids déterministes.
            if (!dbContext.Categories.Any())
            {
                dbContext.Categories.AddRange(
                    CategorieSeedData.Items.Select(item => new Categorie(CategorieSeedData.IdPour(item.Groupe, item.Nom), item.Nom, item.Groupe)));
                dbContext.SaveChanges();
            }
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);

        if (disposing)
        {
            _connection.Dispose();
        }
    }
}
