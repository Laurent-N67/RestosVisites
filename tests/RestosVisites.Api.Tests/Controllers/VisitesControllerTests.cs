using System.Net;
using System.Net.Http.Json;
using RestosVisites.Application.UseCases.CreerRestaurant;
using RestosVisites.Application.UseCases.EnregistrerVisite;

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
}
