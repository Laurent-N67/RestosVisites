using System.Net;
using System.Net.Http.Json;
using RestosVisites.Application.UseCases.Inscrire;
using RestosVisites.Application.UseCases.ObtenirUtilisateurCourant;
using RestosVisites.Application.UseCases.SeConnecter;
using RestosVisites.Domain.Enums;

namespace RestosVisites.Api.Tests.Controllers;

public sealed class AuthControllerTests
{
    private const string MotDePasseValide = "MotDePasse123!";

    [Fact]
    public async Task Register_PremierInscrit_DevientAdminEtEstConnecte()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();

        var request = new InscrireRequest("premier@exemple.test", "Premier", MotDePasseValide);
        var response = await client.PostAsJsonAsync("/api/auth/register", request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<InscrireResponse>(TestContext.Current.CancellationToken);
        Assert.NotNull(body);
        Assert.Equal(RoleUtilisateur.Admin, body.Role);

        // Connecté automatiquement après l'inscription : /me doit fonctionner sans login explicite.
        var meResponse = await client.GetAsync("/api/auth/me", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);
    }

    [Fact]
    public async Task Register_DeuxiemeInscrit_EstSimple()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var premierClient = factory.CreateClient();
        await premierClient.PostAsJsonAsync(
            "/api/auth/register", new InscrireRequest("premier@exemple.test", "Premier", MotDePasseValide),
            TestContext.Current.CancellationToken);

        using var secondClient = factory.CreateClient();
        var response = await secondClient.PostAsJsonAsync(
            "/api/auth/register", new InscrireRequest("second@exemple.test", "Second", MotDePasseValide),
            TestContext.Current.CancellationToken);

        var body = await response.Content.ReadFromJsonAsync<InscrireResponse>(TestContext.Current.CancellationToken);
        Assert.NotNull(body);
        Assert.Equal(RoleUtilisateur.Simple, body.Role);
    }

    [Fact]
    public async Task Register_EmailDejaUtilise_Retourne409()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();
        var request = new InscrireRequest("doublon@exemple.test", "Premier", MotDePasseValide);
        await client.PostAsJsonAsync("/api/auth/register", request, TestContext.Current.CancellationToken);

        using var autreClient = factory.CreateClient();
        var response = await autreClient.PostAsJsonAsync(
            "/api/auth/register", request with { NomAffiche = "Doublon" }, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Register_MotDePasseTropFaible_Retourne422()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();

        var request = new InscrireRequest("faible@exemple.test", "Personne", "faible");
        var response = await client.PostAsJsonAsync("/api/auth/register", request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task Login_IdentifiantsValides_Retourne200EtConnecte()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var clientInscription = factory.CreateClient();
        await clientInscription.PostAsJsonAsync(
            "/api/auth/register", new InscrireRequest("personne@exemple.test", "Personne", MotDePasseValide),
            TestContext.Current.CancellationToken);

        using var clientConnexion = factory.CreateClient();
        var response = await clientConnexion.PostAsJsonAsync(
            "/api/auth/login", new SeConnecterRequest("personne@exemple.test", MotDePasseValide),
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var meResponse = await clientConnexion.GetAsync("/api/auth/me", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);
    }

    [Fact]
    public async Task Login_EmailInconnu_Retourne401()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/auth/login", new SeConnecterRequest("inconnu@exemple.test", MotDePasseValide),
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_MotDePasseIncorrect_Retourne401()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var clientInscription = factory.CreateClient();
        await clientInscription.PostAsJsonAsync(
            "/api/auth/register", new InscrireRequest("personne2@exemple.test", "Personne", MotDePasseValide),
            TestContext.Current.CancellationToken);

        using var clientConnexion = factory.CreateClient();
        var response = await clientConnexion.PostAsJsonAsync(
            "/api/auth/login", new SeConnecterRequest("personne2@exemple.test", "MauvaisMotDePasse123!"),
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_UtilisateurNonAuthentifie_Retourne401()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/auth/me", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Logout_PuisMe_Retourne401()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();
        await client.PostAsJsonAsync(
            "/api/auth/register", new InscrireRequest("adeconnecter@exemple.test", "Personne", MotDePasseValide),
            TestContext.Current.CancellationToken);

        var logoutResponse = await client.PostAsync("/api/auth/logout", null, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NoContent, logoutResponse.StatusCode);

        var meResponse = await client.GetAsync("/api/auth/me", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Unauthorized, meResponse.StatusCode);
    }
}
