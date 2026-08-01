using System.Net;
using System.Net.Http.Json;
using RestosVisites.Api.Controllers;
using RestosVisites.Application.UseCases.CreerRestaurant;
using RestosVisites.Application.UseCases.EnregistrerVisite;
using RestosVisites.Application.UseCases.ListerVisitesRestaurant;

namespace RestosVisites.Api.Tests.Controllers;

public sealed class VisitesControllerTests : IClassFixture<RestosVisitesWebApplicationFactory>
{
    private readonly HttpClient _client;

    public VisitesControllerTests(RestosVisitesWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Post_AvecRestaurantExistant_Retourne201()
    {
        var creationRestaurant = new CreerRestaurantRequest("Restaurant Visite", "1 rue de la Visite", 45.0, 4.0);
        var creationRestaurantResponse = await _client.PostAsJsonAsync(
            "/api/restaurants", creationRestaurant, TestContext.Current.CancellationToken);
        var restaurantCree = await creationRestaurantResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(restaurantCree);

        var request = new EnregistrerVisiteRequest(
            restaurantCree.Id,
            new DateOnly(2026, 7, 25),
            4,
            "Bonne visite",
            ["Vegan"],
            ["https://exemple.test/photo1.jpg", "https://exemple.test/photo2.jpg"]);

        var response = await _client.PostAsJsonAsync("/api/visites", request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<EnregistrerVisiteResponse>(TestContext.Current.CancellationToken);
        Assert.NotNull(body);
        Assert.NotEqual(Guid.Empty, body.Id);
    }

    [Fact]
    public async Task Post_AvecRestaurantIdInexistant_Retourne404()
    {
        var request = new EnregistrerVisiteRequest(
            Guid.NewGuid(),
            new DateOnly(2026, 7, 25),
            3,
            null,
            [],
            []);

        var response = await _client.PostAsJsonAsync("/api/visites", request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Put_VisiteExistante_Retourne204EtModifieLesCategoriesEtPhotos()
    {
        var creationRestaurant = new CreerRestaurantRequest(
            "Restaurant Visite À Modifier", "2 rue de la Modification", 45.0, 4.0);
        var creationRestaurantResponse = await _client.PostAsJsonAsync(
            "/api/restaurants", creationRestaurant, TestContext.Current.CancellationToken);
        var restaurantCree = await creationRestaurantResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(restaurantCree);

        var creationVisite = new EnregistrerVisiteRequest(
            restaurantCree.Id,
            new DateOnly(2026, 7, 25),
            4,
            "Bonne visite",
            ["Vegan"],
            ["https://exemple.test/photo1.jpg"]);
        var creationVisiteResponse = await _client.PostAsJsonAsync(
            "/api/visites", creationVisite, TestContext.Current.CancellationToken);
        var visiteCreee = await creationVisiteResponse.Content.ReadFromJsonAsync<EnregistrerVisiteResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(visiteCreee);

        var modificationBody = new ModifierVisiteBody(
            new DateOnly(2026, 7, 26),
            5,
            "Visite modifiée",
            ["Italien", "Terrasse"],
            ["https://exemple.test/photo2.jpg"]);

        var response = await _client.PutAsJsonAsync(
            $"/api/visites/{visiteCreee.Id}", modificationBody, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var visitesResponse = await _client.GetAsync(
            $"/api/restaurants/{restaurantCree.Id}/visites", TestContext.Current.CancellationToken);
        var visites = await visitesResponse.Content.ReadFromJsonAsync<List<VisiteDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(visites);
        var visiteModifiee = Assert.Single(visites);
        Assert.Equal(new DateOnly(2026, 7, 26), visiteModifiee.Date);
        Assert.Equal(5, visiteModifiee.Note);
        Assert.Equal("Visite modifiée", visiteModifiee.Commentaire);
        // Le many-to-many Visite/Categorie ne garantit pas d'ordre : on compare sans tenir compte de l'ordre.
        Assert.Equal(["Italien", "Terrasse"], visiteModifiee.Categories.OrderBy(c => c, StringComparer.Ordinal));
        Assert.Equal(["https://exemple.test/photo2.jpg"], visiteModifiee.UrlsPhotos);
    }

    [Fact]
    public async Task Put_VisiteInexistante_Retourne404()
    {
        var modificationBody = new ModifierVisiteBody(new DateOnly(2026, 7, 25), 3, null, [], []);

        var response = await _client.PutAsJsonAsync(
            $"/api/visites/{Guid.NewGuid()}", modificationBody, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_VisiteExistante_Retourne204()
    {
        var creationRestaurant = new CreerRestaurantRequest(
            "Restaurant Visite À Supprimer", "3 rue de la Suppression", 45.0, 4.0);
        var creationRestaurantResponse = await _client.PostAsJsonAsync(
            "/api/restaurants", creationRestaurant, TestContext.Current.CancellationToken);
        var restaurantCree = await creationRestaurantResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(restaurantCree);

        var creationVisite = new EnregistrerVisiteRequest(
            restaurantCree.Id,
            new DateOnly(2026, 7, 25),
            4,
            "Bonne visite",
            ["Vegan"],
            ["https://exemple.test/photo1.jpg"]);
        var creationVisiteResponse = await _client.PostAsJsonAsync(
            "/api/visites", creationVisite, TestContext.Current.CancellationToken);
        var visiteCreee = await creationVisiteResponse.Content.ReadFromJsonAsync<EnregistrerVisiteResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(visiteCreee);

        var response = await _client.DeleteAsync($"/api/visites/{visiteCreee.Id}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var visitesResponse = await _client.GetAsync(
            $"/api/restaurants/{restaurantCree.Id}/visites", TestContext.Current.CancellationToken);
        var visites = await visitesResponse.Content.ReadFromJsonAsync<List<VisiteDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(visites);
        Assert.Empty(visites);
    }

    [Fact]
    public async Task Delete_VisiteInexistante_Retourne404()
    {
        var response = await _client.DeleteAsync(
            $"/api/visites/{Guid.NewGuid()}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
