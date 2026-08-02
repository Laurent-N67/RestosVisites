using System.Net;
using System.Net.Http.Json;
using RestosVisites.Api.Controllers;
using RestosVisites.Application.UseCases.CreerRestaurant;
using RestosVisites.Application.UseCases.ListerMesFavoris;

namespace RestosVisites.Api.Tests.Controllers;

public sealed class FavorisControllerTests
{
    [Fact]
    public async Task Get_UtilisateurNonAuthentifie_Retourne401()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/favoris", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Get_SansFavoris_RetourneListeVide()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(client, ct: TestContext.Current.CancellationToken);

        var response = await client.GetAsync("/api/favoris", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var favoris = await response.Content.ReadFromJsonAsync<List<MonFavoriDto>>(TestContext.Current.CancellationToken);
        Assert.NotNull(favoris);
        Assert.Empty(favoris);
    }

    private static async Task<Guid> CreerRestaurantAsync(HttpClient client, string nom, string adresse)
    {
        var response = await client.PostAsJsonAsync(
            "/api/restaurants", new CreerRestaurantRequest(nom, adresse, 45.0, 4.0, []), TestContext.Current.CancellationToken);
        var body = await response.Content.ReadFromJsonAsync<CreerRestaurantResponse>(TestContext.Current.CancellationToken);
        Assert.NotNull(body);
        return body.Id;
    }

    [Fact]
    public async Task Put_RestaurantExistant_AjouteLeFavori()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(client, ct: TestContext.Current.CancellationToken);
        var restaurantId = await CreerRestaurantAsync(client, "Restaurant Favori", "1 rue Favori");

        var response = await client.PutAsync($"/api/favoris/{restaurantId}", null, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var listeResponse = await client.GetAsync("/api/favoris", TestContext.Current.CancellationToken);
        var favoris = await listeResponse.Content.ReadFromJsonAsync<List<MonFavoriDto>>(TestContext.Current.CancellationToken);
        Assert.NotNull(favoris);
        Assert.Contains(favoris, f => f.RestaurantId == restaurantId);
    }

    [Fact]
    public async Task Put_DejaFavori_EstIdempotent()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(client, ct: TestContext.Current.CancellationToken);
        var restaurantId = await CreerRestaurantAsync(client, "Restaurant Favori Idempotent", "2 rue Favori");

        await client.PutAsync($"/api/favoris/{restaurantId}", null, TestContext.Current.CancellationToken);
        var deuxiemeReponse = await client.PutAsync($"/api/favoris/{restaurantId}", null, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, deuxiemeReponse.StatusCode);
        var listeResponse = await client.GetAsync("/api/favoris", TestContext.Current.CancellationToken);
        var favoris = await listeResponse.Content.ReadFromJsonAsync<List<MonFavoriDto>>(TestContext.Current.CancellationToken);
        Assert.NotNull(favoris);
        Assert.Single(favoris);
    }

    [Fact]
    public async Task Put_RestaurantInexistant_Retourne404()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(client, ct: TestContext.Current.CancellationToken);

        var response = await client.PutAsync($"/api/favoris/{Guid.NewGuid()}", null, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Put_DepasseLaLimiteDeSixFavoris_Retourne422()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(client, ct: TestContext.Current.CancellationToken);

        for (var i = 0; i < 6; i++)
        {
            var restaurantId = await CreerRestaurantAsync(client, $"Restaurant Favori {i}", $"{i} rue Favori");
            await client.PutAsync($"/api/favoris/{restaurantId}", null, TestContext.Current.CancellationToken);
        }

        var septiemeRestaurantId = await CreerRestaurantAsync(client, "Restaurant Favori 7", "7 rue Favori");
        var response = await client.PutAsync($"/api/favoris/{septiemeRestaurantId}", null, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task Delete_FavoriExistant_LeRetire()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(client, ct: TestContext.Current.CancellationToken);
        var restaurantId = await CreerRestaurantAsync(client, "Restaurant À Retirer", "9 rue Favori");
        await client.PutAsync($"/api/favoris/{restaurantId}", null, TestContext.Current.CancellationToken);

        var response = await client.DeleteAsync($"/api/favoris/{restaurantId}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var listeResponse = await client.GetAsync("/api/favoris", TestContext.Current.CancellationToken);
        var favoris = await listeResponse.Content.ReadFromJsonAsync<List<MonFavoriDto>>(TestContext.Current.CancellationToken);
        Assert.NotNull(favoris);
        Assert.Empty(favoris);
    }

    [Fact]
    public async Task Delete_FavoriInexistant_EstIdempotent()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(client, ct: TestContext.Current.CancellationToken);

        var response = await client.DeleteAsync($"/api/favoris/{Guid.NewGuid()}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }
}
