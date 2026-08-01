using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RestosVisites.Api.Controllers;
using RestosVisites.Application.UseCases.CreerRestaurant;
using RestosVisites.Application.UseCases.EnregistrerVisite;
using RestosVisites.Application.UseCases.ListerRestaurants;
using RestosVisites.Application.UseCases.ListerVisitesRestaurant;
using RestosVisites.Infrastructure.Persistence.Seed;

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
        var request = new CreerRestaurantRequest("Le Test API", "1 rue de l'Api", 45.0, 4.0, []);

        var response = await _client.PostAsJsonAsync("/api/restaurants", request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<CreerRestaurantResponse>(TestContext.Current.CancellationToken);
        Assert.NotNull(body);
        Assert.NotEqual(Guid.Empty, body.Id);
    }

    [Fact]
    public async Task Post_RestaurantEnDoublon_Retourne409AvecProblemDetails()
    {
        var request = new CreerRestaurantRequest("Restaurant Doublon", "2 rue du Doublon", 45.0, 4.0, []);
        await _client.PostAsJsonAsync("/api/restaurants", request, TestContext.Current.CancellationToken);

        var response = await _client.PostAsJsonAsync("/api/restaurants", request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>(TestContext.Current.CancellationToken);
        Assert.NotNull(problemDetails);
        Assert.Equal(StatusCodes.Status409Conflict, problemDetails.Status);
    }

    [Fact]
    public async Task Post_AvecCategorieIdsValides_Retourne201EtAssocieLesCategories()
    {
        var categorieId = CategorieSeedData.IdPour("Type de cuisine", "Italienne");
        var request = new CreerRestaurantRequest("Restaurant Italien", "11 rue Italienne", 45.0, 4.0, [categorieId]);

        var response = await _client.PostAsJsonAsync("/api/restaurants", request, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var cree = await response.Content.ReadFromJsonAsync<CreerRestaurantResponse>(TestContext.Current.CancellationToken);
        Assert.NotNull(cree);

        var listeResponse = await _client.GetAsync("/api/restaurants", TestContext.Current.CancellationToken);
        var restaurants = await listeResponse.Content.ReadFromJsonAsync<List<RestaurantDto>>(TestContext.Current.CancellationToken);
        Assert.NotNull(restaurants);
        var restaurantCree = Assert.Single(restaurants, r => r.Id == cree.Id);
        Assert.Equal(categorieId, Assert.Single(restaurantCree.Categories).Id);
    }

    [Fact]
    public async Task Post_AvecCategorieIdInexistant_Retourne404()
    {
        var request = new CreerRestaurantRequest("Restaurant Catégorie Invalide", "12 rue Invalide", 45.0, 4.0, [Guid.NewGuid()]);

        var response = await _client.PostAsJsonAsync("/api/restaurants", request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Get_ListeLesRestaurants_ContientLeRestaurantCree()
    {
        var request = new CreerRestaurantRequest("Restaurant à Lister", "3 rue de la Liste", 45.0, 4.0, []);
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
    public async Task GetVisites_RestaurantExistant_ContientLaVisiteAvecSesPhotos()
    {
        var creationRestaurant = new CreerRestaurantRequest("Restaurant Avec Visites", "4 rue des Visites", 45.0, 4.0, []);
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
        Assert.Contains("https://exemple.test/photo.jpg", visite.UrlsPhotos);
    }

    [Fact]
    public async Task GetVisites_RestaurantInexistant_Retourne404()
    {
        var response = await _client.GetAsync(
            $"/api/restaurants/{Guid.NewGuid()}/visites", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Put_RestaurantExistant_Retourne204EtModifieLeRestaurant()
    {
        var creationRequest = new CreerRestaurantRequest("Restaurant à Modifier", "5 rue à Modifier", 45.0, 4.0, []);
        var creationResponse = await _client.PostAsJsonAsync(
            "/api/restaurants", creationRequest, TestContext.Current.CancellationToken);
        var cree = await creationResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(cree);

        var modificationBody = new ModifierRestaurantBody("Restaurant Modifié", "6 rue Modifiée", 46.0, 5.0, []);

        var response = await _client.PutAsJsonAsync(
            $"/api/restaurants/{cree.Id}", modificationBody, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var listeResponse = await _client.GetAsync("/api/restaurants", TestContext.Current.CancellationToken);
        var restaurants = await listeResponse.Content.ReadFromJsonAsync<List<RestaurantDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(restaurants);
        var modifie = Assert.Single(restaurants, r => r.Id == cree.Id);
        Assert.Equal("Restaurant Modifié", modifie.Nom);
        Assert.Equal("6 rue Modifiée", modifie.Adresse);
        Assert.Equal(46.0, modifie.Latitude);
        Assert.Equal(5.0, modifie.Longitude);
    }

    [Fact]
    public async Task Put_AvecCategorieIdsValides_Retourne204EtRemplaceLesCategories()
    {
        var categorieItalienne = CategorieSeedData.IdPour("Type de cuisine", "Italienne");
        var categorieTerrasse = CategorieSeedData.IdPour("Autres caractéristiques", "Terrasse");

        var creationRequest = new CreerRestaurantRequest(
            "Restaurant à Recatégoriser", "13 rue à Recatégoriser", 45.0, 4.0, [categorieItalienne]);
        var creationResponse = await _client.PostAsJsonAsync(
            "/api/restaurants", creationRequest, TestContext.Current.CancellationToken);
        var cree = await creationResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(cree);

        var modificationBody = new ModifierRestaurantBody(
            "Restaurant à Recatégoriser", "13 rue à Recatégoriser", 45.0, 4.0, [categorieTerrasse]);

        var response = await _client.PutAsJsonAsync(
            $"/api/restaurants/{cree.Id}", modificationBody, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var listeResponse = await _client.GetAsync("/api/restaurants", TestContext.Current.CancellationToken);
        var restaurants = await listeResponse.Content.ReadFromJsonAsync<List<RestaurantDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(restaurants);
        var modifie = Assert.Single(restaurants, r => r.Id == cree.Id);
        Assert.Equal(categorieTerrasse, Assert.Single(modifie.Categories).Id);
    }

    [Fact]
    public async Task Put_AvecCategorieIdInexistant_Retourne404()
    {
        var creationRequest = new CreerRestaurantRequest("Restaurant à Ne Pas Modifier", "14 rue Ne Pas Modifier", 45.0, 4.0, []);
        var creationResponse = await _client.PostAsJsonAsync(
            "/api/restaurants", creationRequest, TestContext.Current.CancellationToken);
        var cree = await creationResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(cree);

        var modificationBody = new ModifierRestaurantBody(
            "Restaurant à Ne Pas Modifier", "14 rue Ne Pas Modifier", 45.0, 4.0, [Guid.NewGuid()]);

        var response = await _client.PutAsJsonAsync(
            $"/api/restaurants/{cree.Id}", modificationBody, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Put_RestaurantInexistant_Retourne404()
    {
        var modificationBody = new ModifierRestaurantBody("Nom", "Adresse", 45.0, 4.0, []);

        var response = await _client.PutAsJsonAsync(
            $"/api/restaurants/{Guid.NewGuid()}", modificationBody, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Put_ConflitAvecUnAutreRestaurant_Retourne409()
    {
        var premierRequest = new CreerRestaurantRequest("Restaurant Un", "7 rue Un", 45.0, 4.0, []);
        await _client.PostAsJsonAsync("/api/restaurants", premierRequest, TestContext.Current.CancellationToken);

        var secondRequest = new CreerRestaurantRequest("Restaurant Deux", "8 rue Deux", 45.0, 4.0, []);
        var secondResponse = await _client.PostAsJsonAsync(
            "/api/restaurants", secondRequest, TestContext.Current.CancellationToken);
        var second = await secondResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(second);

        var modificationBody = new ModifierRestaurantBody("Restaurant Un", "7 rue Un", 45.0, 4.0, []);

        var response = await _client.PutAsJsonAsync(
            $"/api/restaurants/{second.Id}", modificationBody, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Delete_RestaurantExistant_Retourne204EtLeRetireDeLaListe()
    {
        var creationRequest = new CreerRestaurantRequest("Restaurant à Supprimer", "9 rue à Supprimer", 45.0, 4.0, []);
        var creationResponse = await _client.PostAsJsonAsync(
            "/api/restaurants", creationRequest, TestContext.Current.CancellationToken);
        var cree = await creationResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(cree);

        var response = await _client.DeleteAsync($"/api/restaurants/{cree.Id}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var listeResponse = await _client.GetAsync("/api/restaurants", TestContext.Current.CancellationToken);
        var restaurants = await listeResponse.Content.ReadFromJsonAsync<List<RestaurantDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(restaurants);
        Assert.DoesNotContain(restaurants, r => r.Id == cree.Id);
    }

    [Fact]
    public async Task Delete_RestaurantInexistant_Retourne404()
    {
        var response = await _client.DeleteAsync(
            $"/api/restaurants/{Guid.NewGuid()}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_RestaurantAvecVisites_SupprimeLesVisitesEnCascade()
    {
        var creationRestaurant = new CreerRestaurantRequest(
            "Restaurant Avec Visite à Supprimer", "10 rue Cascade", 45.0, 4.0, []);
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
            ["https://exemple.test/photo.jpg"]);
        await _client.PostAsJsonAsync("/api/visites", enregistrerVisite, TestContext.Current.CancellationToken);

        var response = await _client.DeleteAsync(
            $"/api/restaurants/{restaurantCree.Id}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var visitesResponse = await _client.GetAsync(
            $"/api/restaurants/{restaurantCree.Id}/visites", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, visitesResponse.StatusCode);
    }
}
