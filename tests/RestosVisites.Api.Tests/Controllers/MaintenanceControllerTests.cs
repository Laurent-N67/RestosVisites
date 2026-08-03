using System.Net;
using System.Net.Http.Json;
using RestosVisites.Api.Controllers;

namespace RestosVisites.Api.Tests.Controllers;

public sealed class MaintenanceControllerTests
{
    [Fact]
    public async Task PostRecompresserPhotos_UtilisateurNonAuthentifie_Retourne401()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsync(
            "/api/maintenance/recompresser-photos", content: null, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task PostRecompresserPhotos_UtilisateurSimple_Retourne403()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken); // premier => Admin

        using var simpleClient = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(simpleClient, ct: TestContext.Current.CancellationToken);

        var response = await simpleClient.PostAsync(
            "/api/maintenance/recompresser-photos", content: null, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task PostRecompresserPhotos_Admin_Retourne200AvecUnResumeVide()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        var response = await admin.PostAsync(
            "/api/maintenance/recompresser-photos", content: null, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var resume = await response.Content.ReadFromJsonAsync<RecompresserPhotosResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(resume);
        // Aucune visite/photo en base de test à ce stade : le résumé doit être vide, pas une erreur.
        Assert.Equal(0, resume.PhotosRecompressees);
        Assert.Equal(0, resume.PhotosEnErreur);
    }
}
