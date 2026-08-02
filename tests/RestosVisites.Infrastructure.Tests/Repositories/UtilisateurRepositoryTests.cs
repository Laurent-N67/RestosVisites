using RestosVisites.Domain.Entities;
using RestosVisites.Domain.Enums;
using RestosVisites.Infrastructure.Persistence.Repositories;

namespace RestosVisites.Infrastructure.Tests.Repositories;

public sealed class UtilisateurRepositoryTests : SqliteTestBase
{
    [Fact]
    public async Task AjouterAsync_PuisObtenirParIdAsync_DepuisNouveauDbContext_RetrouveLUtilisateur()
    {
        var utilisateur = new Utilisateur("personne@exemple.test", "Personne", "hash", "sel", 600_000, RoleUtilisateur.Simple);

        await using (var dbContext = CreerDbContext())
        {
            var repository = new UtilisateurRepository(dbContext);
            await repository.AjouterAsync(utilisateur, TestContext.Current.CancellationToken);
        }

        await using var autreDbContext = CreerDbContext();
        var autreRepository = new UtilisateurRepository(autreDbContext);
        var utilisateurRelu = await autreRepository.ObtenirParIdAsync(utilisateur.Id, TestContext.Current.CancellationToken);

        Assert.NotNull(utilisateurRelu);
        Assert.Equal(utilisateur.Id, utilisateurRelu.Id);
        Assert.Equal(utilisateur.Email, utilisateurRelu.Email);
        Assert.Equal(utilisateur.NomAffiche, utilisateurRelu.NomAffiche);
        Assert.Equal(utilisateur.Role, utilisateurRelu.Role);
    }

    [Fact]
    public async Task ObtenirParEmailAsync_QuandLUtilisateurExiste_LeRetourne()
    {
        var utilisateur = new Utilisateur("Personne@Exemple.Test", "Personne", "hash", "sel", 600_000, RoleUtilisateur.Simple);

        await using (var dbContext = CreerDbContext())
        {
            var repository = new UtilisateurRepository(dbContext);
            await repository.AjouterAsync(utilisateur, TestContext.Current.CancellationToken);
        }

        await using var autreDbContext = CreerDbContext();
        var autreRepository = new UtilisateurRepository(autreDbContext);
        var utilisateurRelu = await autreRepository.ObtenirParEmailAsync(
            "personne@exemple.test", TestContext.Current.CancellationToken);

        Assert.NotNull(utilisateurRelu);
        Assert.Equal(utilisateur.Id, utilisateurRelu.Id);
    }

    [Fact]
    public async Task ObtenirParEmailAsync_QuandLUtilisateurNExistePas_RetourneNull()
    {
        await using var dbContext = CreerDbContext();
        var repository = new UtilisateurRepository(dbContext);

        var utilisateurRelu = await repository.ObtenirParEmailAsync("inconnu@exemple.test", TestContext.Current.CancellationToken);

        Assert.Null(utilisateurRelu);
    }

    [Fact]
    public async Task ListerAsync_RetourneTousLesUtilisateursAjoutes()
    {
        var premier = new Utilisateur("premier@exemple.test", "Premier", "hash", "sel", 600_000, RoleUtilisateur.Admin);
        var second = new Utilisateur("second@exemple.test", "Second", "hash", "sel", 600_000, RoleUtilisateur.Simple);

        await using (var dbContext = CreerDbContext())
        {
            var repository = new UtilisateurRepository(dbContext);
            await repository.AjouterAsync(premier, TestContext.Current.CancellationToken);
            await repository.AjouterAsync(second, TestContext.Current.CancellationToken);
        }

        await using var autreDbContext = CreerDbContext();
        var autreRepository = new UtilisateurRepository(autreDbContext);
        var utilisateurs = await autreRepository.ListerAsync(TestContext.Current.CancellationToken);

        Assert.Equal(2, utilisateurs.Count);
        Assert.Contains(utilisateurs, u => u.Id == premier.Id);
        Assert.Contains(utilisateurs, u => u.Id == second.Id);
    }

    [Fact]
    public async Task ExisteAuMoinsUnUtilisateurReelAsync_BaseVide_RetourneFalse()
    {
        await using var dbContext = CreerDbContext();
        var repository = new UtilisateurRepository(dbContext);

        var existe = await repository.ExisteAuMoinsUnUtilisateurReelAsync(TestContext.Current.CancellationToken);

        Assert.False(existe);
    }

    [Fact]
    public async Task ExisteAuMoinsUnUtilisateurReelAsync_AvecUnUtilisateur_RetourneTrue()
    {
        await using (var dbContext = CreerDbContext())
        {
            var repository = new UtilisateurRepository(dbContext);
            await repository.AjouterAsync(
                new Utilisateur("personne@exemple.test", "Personne", "hash", "sel", 600_000, RoleUtilisateur.Admin),
                TestContext.Current.CancellationToken);
        }

        await using var autreDbContext = CreerDbContext();
        var autreRepository = new UtilisateurRepository(autreDbContext);

        var existe = await autreRepository.ExisteAuMoinsUnUtilisateurReelAsync(TestContext.Current.CancellationToken);

        Assert.True(existe);
    }

    [Fact]
    public async Task CompterAdminsAsync_RetourneLeNombreDadmins()
    {
        await using (var dbContext = CreerDbContext())
        {
            var repository = new UtilisateurRepository(dbContext);
            await repository.AjouterAsync(
                new Utilisateur("admin1@exemple.test", "Admin 1", "hash", "sel", 600_000, RoleUtilisateur.Admin),
                TestContext.Current.CancellationToken);
            await repository.AjouterAsync(
                new Utilisateur("admin2@exemple.test", "Admin 2", "hash", "sel", 600_000, RoleUtilisateur.Admin),
                TestContext.Current.CancellationToken);
            await repository.AjouterAsync(
                new Utilisateur("simple@exemple.test", "Simple", "hash", "sel", 600_000, RoleUtilisateur.Simple),
                TestContext.Current.CancellationToken);
        }

        await using var autreDbContext = CreerDbContext();
        var autreRepository = new UtilisateurRepository(autreDbContext);
        var nombreAdmins = await autreRepository.CompterAdminsAsync(TestContext.Current.CancellationToken);

        Assert.Equal(2, nombreAdmins);
    }

    [Fact]
    public async Task MettreAJourAsync_ApresChangerRole_PersisteLeNouveauRole()
    {
        var utilisateur = new Utilisateur("personne@exemple.test", "Personne", "hash", "sel", 600_000, RoleUtilisateur.Simple);

        await using (var dbContext = CreerDbContext())
        {
            var repository = new UtilisateurRepository(dbContext);
            await repository.AjouterAsync(utilisateur, TestContext.Current.CancellationToken);
        }

        await using (var dbContext = CreerDbContext())
        {
            var repository = new UtilisateurRepository(dbContext);
            var utilisateurATracker = await repository.ObtenirParIdAsync(utilisateur.Id, TestContext.Current.CancellationToken);
            Assert.NotNull(utilisateurATracker);

            utilisateurATracker.ChangerRole(RoleUtilisateur.Admin);
            await repository.MettreAJourAsync(utilisateurATracker, TestContext.Current.CancellationToken);
        }

        await using var autreDbContext = CreerDbContext();
        var autreRepository = new UtilisateurRepository(autreDbContext);
        var utilisateurRelu = await autreRepository.ObtenirParIdAsync(utilisateur.Id, TestContext.Current.CancellationToken);

        Assert.NotNull(utilisateurRelu);
        Assert.Equal(RoleUtilisateur.Admin, utilisateurRelu.Role);
    }
}
