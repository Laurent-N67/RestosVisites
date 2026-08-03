using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RestosVisites.Api.Controllers;
using RestosVisites.Application.UseCases.ListerUtilisateursAvecFavoris;
using RestosVisites.Application.UseCases.SeConnecter;
using RestosVisites.Domain.Entities;
using RestosVisites.Domain.Enums;
using RestosVisites.Infrastructure.Persistence;
using RestosVisites.Infrastructure.Persistence.Seed;

namespace RestosVisites.Api.Tests.Controllers;

public sealed class UtilisateursControllerTests
{
    [Fact]
    public async Task Get_UtilisateurNonAuthentifie_Retourne401()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/utilisateurs", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Get_UtilisateurAuthentifie_ListeLesUtilisateurs()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();
        var utilisateur = await AuthTestHelper.InscrireEtConnecterAsync(client, ct: TestContext.Current.CancellationToken);

        var response = await client.GetAsync("/api/utilisateurs", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var utilisateurs = await response.Content.ReadFromJsonAsync<List<UtilisateurAvecFavorisDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(utilisateurs);
        Assert.Contains(utilisateurs, u => u.Id == utilisateur.Id);
    }

    [Fact]
    public async Task Get_UtilisateurSimple_NeVoitPasLEmailDesAutres()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken); // premier => Admin

        using var simpleClient = factory.CreateClient();
        var simple = await AuthTestHelper.InscrireEtConnecterAsync(simpleClient, ct: TestContext.Current.CancellationToken);

        var response = await simpleClient.GetAsync("/api/utilisateurs", TestContext.Current.CancellationToken);

        var utilisateurs = await response.Content.ReadFromJsonAsync<List<UtilisateurAvecFavorisDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(utilisateurs);
        var moi = Assert.Single(utilisateurs, u => u.Id == simple.Id);
        var lAutre = Assert.Single(utilisateurs, u => u.Id != simple.Id);
        Assert.NotNull(moi.Email);
        Assert.Null(lAutre.Email);
    }

    [Fact]
    public async Task Get_UtilisateurAdmin_VoitLEmailDeTousLesUtilisateurs()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken); // premier => Admin

        using var simpleClient = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(simpleClient, ct: TestContext.Current.CancellationToken);

        var response = await admin.GetAsync("/api/utilisateurs", TestContext.Current.CancellationToken);

        var utilisateurs = await response.Content.ReadFromJsonAsync<List<UtilisateurAvecFavorisDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(utilisateurs);
        Assert.All(utilisateurs, u => Assert.NotNull(u.Email));
    }

    [Fact]
    public async Task PutRole_Admin_ChangeLeRoleDunAutreUtilisateur()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken); // premier => Admin

        using var simpleClient = factory.CreateClient();
        var simple = await AuthTestHelper.InscrireEtConnecterAsync(simpleClient, ct: TestContext.Current.CancellationToken);

        var response = await admin.PutAsJsonAsync(
            $"/api/utilisateurs/{simple.Id}/role", new ChangerRoleBody(RoleUtilisateur.Admin), TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var listeResponse = await admin.GetAsync("/api/utilisateurs", TestContext.Current.CancellationToken);
        var utilisateurs = await listeResponse.Content.ReadFromJsonAsync<List<UtilisateurAvecFavorisDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(utilisateurs);
        var utilisateurMisAJour = Assert.Single(utilisateurs, u => u.Id == simple.Id);
        Assert.Equal(RoleUtilisateur.Admin, utilisateurMisAJour.Role);
    }

    [Fact]
    public async Task PutRole_UtilisateurSimple_Retourne403()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken); // premier => Admin

        using var simpleClient = factory.CreateClient();
        var simple = await AuthTestHelper.InscrireEtConnecterAsync(simpleClient, ct: TestContext.Current.CancellationToken);

        var response = await simpleClient.PutAsJsonAsync(
            $"/api/utilisateurs/{simple.Id}/role", new ChangerRoleBody(RoleUtilisateur.Admin), TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task PutRole_RetrograderLeDernierAdmin_Retourne422()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        var seulAdmin = await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        var response = await admin.PutAsJsonAsync(
            $"/api/utilisateurs/{seulAdmin.Id}/role", new ChangerRoleBody(RoleUtilisateur.Simple), TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task PutRole_UtilisateurInexistant_Retourne404()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        var response = await admin.PutAsJsonAsync(
            $"/api/utilisateurs/{Guid.NewGuid()}/role", new ChangerRoleBody(RoleUtilisateur.Admin), TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task PutMotDePasse_Admin_ReinitialiseLeMotDePasseDunAutreUtilisateur()
    {
        const string nouveauMotDePasse = "NouveauMotDePasse123!";
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken); // premier => Admin

        using var simpleClient = factory.CreateClient();
        var email = $"{Guid.NewGuid():N}@exemple.test";
        var simple = await AuthTestHelper.InscrireEtConnecterAsync(simpleClient, email: email, ct: TestContext.Current.CancellationToken);

        var response = await admin.PutAsJsonAsync(
            $"/api/utilisateurs/{simple.Id}/mot-de-passe",
            new ReinitialiserMotDePasseBody(nouveauMotDePasse),
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        using var reconnexionClient = factory.CreateClient();
        var loginResponse = await reconnexionClient.PostAsJsonAsync(
            "/api/auth/login", new SeConnecterRequest(email, nouveauMotDePasse), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
    }

    [Fact]
    public async Task PutMotDePasse_UtilisateurNonAuthentifie_Retourne401()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        var seulAdmin = await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        using var anonyme = factory.CreateClient();
        var response = await anonyme.PutAsJsonAsync(
            $"/api/utilisateurs/{seulAdmin.Id}/mot-de-passe",
            new ReinitialiserMotDePasseBody("NouveauMotDePasse123!"),
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task PutMotDePasse_UtilisateurSimple_Retourne403()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken); // premier => Admin

        using var simpleClient = factory.CreateClient();
        var simple = await AuthTestHelper.InscrireEtConnecterAsync(simpleClient, ct: TestContext.Current.CancellationToken);

        var response = await simpleClient.PutAsJsonAsync(
            $"/api/utilisateurs/{simple.Id}/mot-de-passe",
            new ReinitialiserMotDePasseBody("NouveauMotDePasse123!"),
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task PutMotDePasse_UtilisateurInexistant_Retourne404()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        var response = await admin.PutAsJsonAsync(
            $"/api/utilisateurs/{Guid.NewGuid()}/mot-de-passe",
            new ReinitialiserMotDePasseBody("NouveauMotDePasse123!"),
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task PutMotDePasse_MotDePasseTropFaible_Retourne422()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        var seulAdmin = await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        var response = await admin.PutAsJsonAsync(
            $"/api/utilisateurs/{seulAdmin.Id}/mot-de-passe",
            new ReinitialiserMotDePasseBody("faible"),
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task Delete_Admin_SupprimeUnAutreUtilisateur()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken); // premier => Admin

        using var simpleClient = factory.CreateClient();
        var simple = await AuthTestHelper.InscrireEtConnecterAsync(simpleClient, ct: TestContext.Current.CancellationToken);

        var response = await admin.DeleteAsync($"/api/utilisateurs/{simple.Id}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var listeResponse = await admin.GetAsync("/api/utilisateurs", TestContext.Current.CancellationToken);
        var utilisateurs = await listeResponse.Content.ReadFromJsonAsync<List<UtilisateurAvecFavorisDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(utilisateurs);
        Assert.DoesNotContain(utilisateurs, u => u.Id == simple.Id);
    }

    [Fact]
    public async Task Delete_UtilisateurNonAuthentifie_Retourne401()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        var seulAdmin = await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        using var anonyme = factory.CreateClient();
        var response = await anonyme.DeleteAsync($"/api/utilisateurs/{seulAdmin.Id}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Delete_UtilisateurSimple_Retourne403()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken); // premier => Admin

        using var simpleClient = factory.CreateClient();
        var simple = await AuthTestHelper.InscrireEtConnecterAsync(simpleClient, ct: TestContext.Current.CancellationToken);

        var response = await simpleClient.DeleteAsync($"/api/utilisateurs/{simple.Id}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Delete_UtilisateurInexistant_Retourne404()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        var response = await admin.DeleteAsync($"/api/utilisateurs/{Guid.NewGuid()}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_DernierAdmin_Retourne422()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        var seulAdmin = await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        var response = await admin.DeleteAsync($"/api/utilisateurs/{seulAdmin.Id}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    /// <summary>
    /// Vérifie de bout en bout (vraie requête HTTP + vrai <see cref="RestosVisites.Infrastructure.Persistence.Repositories.UtilisateurRepository"/>)
    /// que le compte historique ne peut pas être supprimé via la route Admin. La ligne
    /// <see cref="LegacyUtilisateurSeed"/> n'est jamais présente dans la base de test (celle-ci est
    /// créée via <c>EnsureCreated()</c>, qui ne rejoue pas l'InsertData de la migration) : on l'insère
    /// donc manuellement ici avant d'appeler l'API.
    /// </summary>
    [Fact]
    public async Task Delete_UtilisateurHistorique_Retourne422EtNeSupprimePasLaLigne()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken); // premier => Admin

        using (var scope = factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<RestosVisitesDbContext>();
            dbContext.Utilisateurs.Add(new Utilisateur(
                LegacyUtilisateurSeed.Id,
                LegacyUtilisateurSeed.Email,
                LegacyUtilisateurSeed.NomAffiche,
                LegacyUtilisateurSeed.MotDePasseHash,
                LegacyUtilisateurSeed.MotDePasseSel,
                LegacyUtilisateurSeed.MotDePasseIterations,
                LegacyUtilisateurSeed.Role));
            await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        var response = await admin.DeleteAsync(
            $"/api/utilisateurs/{LegacyUtilisateurSeed.Id}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<RestosVisitesDbContext>();
            var toujoursPresent = await dbContext.Utilisateurs.AnyAsync(
                u => u.Id == LegacyUtilisateurSeed.Id, TestContext.Current.CancellationToken);
            Assert.True(toujoursPresent);
        }
    }

    /// <summary>
    /// Un Admin qui se supprime lui-même via la route Admin (et non <c>/api/auth/me</c>) doit voir sa
    /// session invalidée immédiatement : une requête <c>GET /api/auth/me</c> ultérieure sur le même
    /// <see cref="HttpClient"/> (donc avec le même cookie) doit retourner 401, prouvant que la branche
    /// <c>SignOutAsync</c> de <see cref="RestosVisites.Api.Controllers.UtilisateursController.Supprimer"/>
    /// a un effet réel, pas seulement que le code a été exécuté.
    /// </summary>
    [Fact]
    public async Task Delete_AdminSupprimeSonPropreCompteViaRouteAdmin_Retourne204EtInvalideLaSession()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var premierAdmin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(premierAdmin, ct: TestContext.Current.CancellationToken); // premier => Admin

        using var deuxiemeAdminClient = factory.CreateClient();
        var email = $"{Guid.NewGuid():N}@exemple.test";
        var deuxiemeAdmin = await AuthTestHelper.InscrireEtConnecterAsync(
            deuxiemeAdminClient, email: email, ct: TestContext.Current.CancellationToken); // second => Simple par défaut

        // Promu Admin pour que la garde "dernier administrateur" ne bloque pas son auto-suppression.
        var promotionResponse = await premierAdmin.PutAsJsonAsync(
            $"/api/utilisateurs/{deuxiemeAdmin.Id}/role", new ChangerRoleBody(RoleUtilisateur.Admin),
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NoContent, promotionResponse.StatusCode);

        // Le rôle est porté par les claims du cookie, établies au login : la promotion ci-dessus ne
        // met pas à jour la session déjà ouverte, il faut se reconnecter pour obtenir un cookie avec
        // le claim "Admin" et ainsi passer la policy "Admin" de la route de suppression.
        var reconnexionResponse = await deuxiemeAdminClient.PostAsJsonAsync(
            "/api/auth/login", new SeConnecterRequest(email, AuthTestHelper.MotDePasseValide),
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, reconnexionResponse.StatusCode);

        var response = await deuxiemeAdminClient.DeleteAsync(
            $"/api/utilisateurs/{deuxiemeAdmin.Id}", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var meResponse = await deuxiemeAdminClient.GetAsync("/api/auth/me", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Unauthorized, meResponse.StatusCode);
    }
}
