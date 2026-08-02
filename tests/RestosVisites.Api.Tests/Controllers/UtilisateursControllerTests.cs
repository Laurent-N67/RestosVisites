using System.Net;
using System.Net.Http.Json;
using RestosVisites.Api.Controllers;
using RestosVisites.Application.UseCases.ListerUtilisateursAvecFavoris;
using RestosVisites.Domain.Enums;

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
}
