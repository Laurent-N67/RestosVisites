using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using RestosVisites.Infrastructure.Persistence;

namespace RestosVisites.Infrastructure.Tests;

/// <summary>
/// Base commune aux tests d'intégration Infrastructure : ouvre une connexion SQLite en mémoire
/// dédiée à l'instance de test (xUnit crée une nouvelle instance de classe par test, ce qui isole
/// naturellement chaque test) et crée le schéma une fois via <see cref="DbContext.EnsureCreated"/>.
/// La connexion est gardée ouverte pendant toute la durée du test : une base SQLite ":memory:" est
/// détruite dès que la dernière connexion se ferme, d'où l'importance de la réutiliser pour chaque
/// nouvelle instance de <see cref="RestosVisitesDbContext"/> créée par le test.
/// </summary>
public abstract class SqliteTestBase : IDisposable
{
    private readonly SqliteConnection _connection;

    protected SqliteTestBase()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();

        using var dbContext = CreerDbContext();
        dbContext.Database.EnsureCreated();
    }

    /// <summary>
    /// Crée une nouvelle instance de <see cref="RestosVisitesDbContext"/> sur la même connexion,
    /// afin de vérifier que les données sont bien relues depuis la base (pas depuis le tracker EF
    /// d'un contexte déjà en mémoire).
    /// </summary>
    protected RestosVisitesDbContext CreerDbContext()
    {
        var options = new DbContextOptionsBuilder<RestosVisitesDbContext>()
            .UseSqlite(_connection)
            .Options;

        return new RestosVisitesDbContext(options);
    }

    public void Dispose() => _connection.Dispose();
}
