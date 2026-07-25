using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RestosVisites.Application.UseCases.CreerRestaurant;
using RestosVisites.Application.UseCases.EnregistrerVisite;
using RestosVisites.Application.UseCases.ListerRestaurants;
using RestosVisites.Application.UseCases.ListerVisitesRestaurant;

namespace RestosVisites.Api.Tests.Controllers;

public sealed class RestaurantsControllerTests : IClassFixture<RestosVisitesWebApplicationFactory>
{
    private readonly HttpClient _client;

    public RestaurantsControllerTests(RestosVisitesWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Post_CreeUnRestaurant_Retourne201EtIdValide()
    {
        var request = new CreerRestaurantRequest("Le Test API", "1 rue de l'Api", 45.0, 4.0);

        var response = await _client.PostAsJsonAsync("/api/restaurants", request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<CreerRestaurantResponse>(TestContext.Current.CancellationToken);
        Assert.NotNull(body);
        Assert.NotEqual(Guid.Empty, body.Id);
    }

    [Fact]
    public async Task Post_RestaurantEnDoublon_Retourne409AvecProblemDetails()
    {
        var request = new CreerRestaurantRequest("Restaurant Doublon", "2 rue du Doublon", 45.0, 4.0);
        await _client.PostAsJsonAsync("/api/restaurants", request, TestContext.Current.CancellationToken);

        var response = await _client.PostAsJsonAsync("/api/restaurants", request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>(TestContext.Current.CancellationToken);
        Assert.NotNull(problemDetails);
        Assert.Equal(StatusCodes.Status409Conflict, problemDetails.Status);
    }

    [Fact]
    public async Task Get_ListeLesRestaurants_ContientLeRestaurantCree()
    {
        var request = new CreerRestaurantRequest("Restaurant à Lister", "3 rue de la Liste", 45.0, 4.0);
        var creationResponse = await _client.PostAsJsonAsync("/api/restaurants", request, TestContext.Current.CancellationToken);
        var cree = await creationResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(TestContext.Current.CancellationToken);
        Assert.NotNull(cree);

        var response = await _client.GetAsync("/api/restaurants", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var restaurants = await response.Content.ReadFromJsonAsync<List<RestaurantDto>>(TestContext.Current.CancellationToken);
        Assert.NotNull(restaurants);
        Assert.Contains(restaurants, r => r.Id == cree.Id);
    }

    [Fact]
    public async Task GetVisites_RestaurantExistant_ContientLaVisiteAvecSesCategoriesEtPhotos()
    {
        var creationRestaurant = new CreerRestaurantRequest("Restaurant Avec Visites", "4 rue des Visites", 45.0, 4.0);
        var creationRestaurantResponse = await _client.PostAsJsonAsync(
            "/api/restaurants", creationRestaurant, TestContext.Current.CancellationToken);
        var restaurantCree = await creationRestaurantResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(restaurantCree);

        var enregistrerVisite = new EnregistrerVisiteRequest(
            restaurantCree.Id,
            new DateOnly(2026, 7, 25),
            5,
            "Très bon accueil",
            ["Italien", "Terrasse"],
            ["https://exemple.test/photo.jpg"]);
        await _client.PostAsJsonAsync("/api/visites", enregistrerVisite, TestContext.Current.CancellationToken);

        var response = await _client.GetAsync(
            $"/api/restaurants/{restaurantCree.Id}/visites", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var visites = await response.Content.ReadFromJsonAsync<List<VisiteDto>>(TestContext.Current.CancellationToken);
        Assert.NotNull(visites);
        var visite = Assert.Single(visites);
        Assert.Equal(restaurantCree.Id, visite.RestaurantId);
        Assert.Equal(5, visite.Note);
        Assert.Contains("Italien", visite.Categories);
        Assert.Contains("Terrasse", visite.Categories);
        Assert.Contains("https://exemple.test/photo.jpg", visite.UrlsPhotos);
    }

    [Fact]
    public async Task GetVisites_RestaurantInexistant_Retourne404()
    {
        var response = await _client.GetAsync(
            $"/api/restaurants/{Guid.NewGuid()}/visites", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
