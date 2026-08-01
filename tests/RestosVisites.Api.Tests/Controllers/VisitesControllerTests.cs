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
    public async Task Get_ListeVide_Retourne200EtListeVide()
    {
        // Utilise sa propre factory (base en mémoire dédiée) plutôt que celle partagée par la classe,
        // car les autres tests de la classe créent des visites sur la même base via IClassFixture.
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/visites", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var visites = await response.Content.ReadFromJsonAsync<List<VisiteDto>>(TestContext.Current.CancellationToken);
        Assert.NotNull(visites);
        Assert.Empty(visites);
    }

    [Fact]
    public async Task Get_AvecVisitesSurPlusieursRestaurants_RetourneToutesLesVisites()
    {
        var creationRestaurant1 = new CreerRestaurantRequest(
            "Restaurant Liste 1", "1 rue de la Liste", 45.0, 4.0, []);
        var creationRestaurant1Response = await _client.PostAsJsonAsync(
            "/api/restaurants", creationRestaurant1, TestContext.Current.CancellationToken);
        var restaurant1 = await creationRestaurant1Response.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(restaurant1);

        var creationRestaurant2 = new CreerRestaurantRequest(
            "Restaurant Liste 2", "2 rue de la Liste", 45.1, 4.1, []);
        var creationRestaurant2Response = await _client.PostAsJsonAsync(
            "/api/restaurants", creationRestaurant2, TestContext.Current.CancellationToken);
        var restaurant2 = await creationRestaurant2Response.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(restaurant2);

        var creationVisite1 = new EnregistrerVisiteRequest(
            restaurant1.Id, new DateOnly(2026, 7, 25), 4, "Bonne visite", []);
        var creationVisite1Response = await _client.PostAsJsonAsync(
            "/api/visites", creationVisite1, TestContext.Current.CancellationToken);
        var visite1 = await creationVisite1Response.Content.ReadFromJsonAsync<EnregistrerVisiteResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(visite1);

        var creationVisite2 = new EnregistrerVisiteRequest(
            restaurant2.Id, new DateOnly(2026, 7, 26), 5, "Excellente visite", []);
        var creationVisite2Response = await _client.PostAsJsonAsync(
            "/api/visites", creationVisite2, TestContext.Current.CancellationToken);
        var visite2 = await creationVisite2Response.Content.ReadFromJsonAsync<EnregistrerVisiteResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(visite2);

        var response = await _client.GetAsync("/api/visites", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var visites = await response.Content.ReadFromJsonAsync<List<VisiteDto>>(TestContext.Current.CancellationToken);
        Assert.NotNull(visites);
        Assert.Contains(visites, v => v.Id == visite1.Id && v.RestaurantId == restaurant1.Id);
        Assert.Contains(visites, v => v.Id == visite2.Id && v.RestaurantId == restaurant2.Id);
    }

    [Fact]
    public async Task Post_AvecRestaurantExistant_Retourne201()
    {
        var creationRestaurant = new CreerRestaurantRequest("Restaurant Visite", "1 rue de la Visite", 45.0, 4.0, []);
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
            []);

        var response = await _client.PostAsJsonAsync("/api/visites", request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Put_VisiteExistante_Retourne204EtModifieLesPhotos()
    {
        var creationRestaurant = new CreerRestaurantRequest(
            "Restaurant Visite À Modifier", "2 rue de la Modification", 45.0, 4.0, []);
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
        Assert.Equal(["https://exemple.test/photo2.jpg"], visiteModifiee.UrlsPhotos);
    }

    [Fact]
    public async Task Put_VisiteInexistante_Retourne404()
    {
        var modificationBody = new ModifierVisiteBody(new DateOnly(2026, 7, 25), 3, null, []);

        var response = await _client.PutAsJsonAsync(
            $"/api/visites/{Guid.NewGuid()}", modificationBody, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_VisiteExistante_Retourne204()
    {
        var creationRestaurant = new CreerRestaurantRequest(
            "Restaurant Visite À Supprimer", "3 rue de la Suppression", 45.0, 4.0, []);
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
