using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RestosVisites.Api.Controllers;
using RestosVisites.Application.UseCases.AjouterPhotoRestaurant;
using RestosVisites.Application.UseCases.CreerRestaurant;
using RestosVisites.Application.UseCases.EnregistrerVisite;
using RestosVisites.Application.UseCases.ListerRestaurants;
using RestosVisites.Application.UseCases.ListerVisitesRestaurant;
using RestosVisites.Infrastructure.Persistence.Seed;

namespace RestosVisites.Api.Tests.Controllers;

/// <summary>
/// Chaque test utilise sa propre factory (base en mémoire dédiée) plutôt qu'une factory partagée
/// via <see cref="IClassFixture{TFixture}"/> : la règle "le premier utilisateur inscrit devient
/// Admin" doit être déterministe pour les tests qui ont besoin d'un compte Admin (Modifier/Supprimer
/// un restaurant), ce qui exige une base fraîche par test plutôt qu'une base partagée entre tests
/// exécutés dans un ordre non garanti.
/// </summary>
public sealed class RestaurantsControllerTests
{
    [Fact]
    public async Task Post_CreeUnRestaurant_Retourne201EtIdValide()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(client, ct: TestContext.Current.CancellationToken);

        var request = new CreerRestaurantRequest("Le Test API", "1 rue de l'Api", 45.0, 4.0, []);

        var response = await client.PostAsJsonAsync("/api/restaurants", request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<CreerRestaurantResponse>(TestContext.Current.CancellationToken);
        Assert.NotNull(body);
        Assert.NotEqual(Guid.Empty, body.Id);
    }

    [Fact]
    public async Task Post_UtilisateurNonAuthentifie_Retourne401()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();

        var request = new CreerRestaurantRequest("Restaurant Non Authentifié", "1 rue Anonyme", 45.0, 4.0, []);

        var response = await client.PostAsJsonAsync("/api/restaurants", request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Post_RestaurantEnDoublon_Retourne409AvecProblemDetails()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(client, ct: TestContext.Current.CancellationToken);

        var request = new CreerRestaurantRequest("Restaurant Doublon", "2 rue du Doublon", 45.0, 4.0, []);
        await client.PostAsJsonAsync("/api/restaurants", request, TestContext.Current.CancellationToken);

        var response = await client.PostAsJsonAsync("/api/restaurants", request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>(TestContext.Current.CancellationToken);
        Assert.NotNull(problemDetails);
        Assert.Equal(StatusCodes.Status409Conflict, problemDetails.Status);
    }

    [Fact]
    public async Task Post_AvecCategorieIdsValides_Retourne201EtAssocieLesCategories()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(client, ct: TestContext.Current.CancellationToken);

        var categorieId = CategorieSeedData.IdPour("Type de cuisine", "Italienne");
        var request = new CreerRestaurantRequest("Restaurant Italien", "11 rue Italienne", 45.0, 4.0, [categorieId]);

        var response = await client.PostAsJsonAsync("/api/restaurants", request, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var cree = await response.Content.ReadFromJsonAsync<CreerRestaurantResponse>(TestContext.Current.CancellationToken);
        Assert.NotNull(cree);

        var listeResponse = await client.GetAsync("/api/restaurants", TestContext.Current.CancellationToken);
        var restaurants = await listeResponse.Content.ReadFromJsonAsync<List<RestaurantDto>>(TestContext.Current.CancellationToken);
        Assert.NotNull(restaurants);
        var restaurantCree = Assert.Single(restaurants, r => r.Id == cree.Id);
        Assert.Equal(categorieId, Assert.Single(restaurantCree.Categories).Id);
    }

    [Fact]
    public async Task Post_AvecCategorieIdInexistant_Retourne404()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(client, ct: TestContext.Current.CancellationToken);

        var request = new CreerRestaurantRequest("Restaurant Catégorie Invalide", "12 rue Invalide", 45.0, 4.0, [Guid.NewGuid()]);

        var response = await client.PostAsJsonAsync("/api/restaurants", request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Get_ListeLesRestaurants_ContientLeRestaurantCree()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(client, ct: TestContext.Current.CancellationToken);

        var request = new CreerRestaurantRequest("Restaurant à Lister", "3 rue de la Liste", 45.0, 4.0, []);
        var creationResponse = await client.PostAsJsonAsync("/api/restaurants", request, TestContext.Current.CancellationToken);
        var cree = await creationResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(TestContext.Current.CancellationToken);
        Assert.NotNull(cree);

        var response = await client.GetAsync("/api/restaurants", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var restaurants = await response.Content.ReadFromJsonAsync<List<RestaurantDto>>(TestContext.Current.CancellationToken);
        Assert.NotNull(restaurants);
        Assert.Contains(restaurants, r => r.Id == cree.Id);
    }

    [Fact]
    public async Task GetVisites_RestaurantExistant_ContientLaVisiteAvecSesPhotos()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(client, ct: TestContext.Current.CancellationToken);

        var creationRestaurant = new CreerRestaurantRequest("Restaurant Avec Visites", "4 rue des Visites", 45.0, 4.0, []);
        var creationRestaurantResponse = await client.PostAsJsonAsync(
            "/api/restaurants", creationRestaurant, TestContext.Current.CancellationToken);
        var restaurantCree = await creationRestaurantResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(restaurantCree);

        var enregistrerVisite = new EnregistrerVisiteBody(
            restaurantCree.Id, new DateOnly(2026, 7, 25), 5, "Très bon accueil", ["https://exemple.test/photo.jpg"]);
        await client.PostAsJsonAsync("/api/visites", enregistrerVisite, TestContext.Current.CancellationToken);

        var response = await client.GetAsync(
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
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(client, ct: TestContext.Current.CancellationToken);

        var response = await client.GetAsync(
            $"/api/restaurants/{Guid.NewGuid()}/visites", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Put_AdminModifieUnRestaurantExistant_Retourne204EtModifieLeRestaurant()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken); // premier inscrit => Admin

        var creationRequest = new CreerRestaurantRequest("Restaurant à Modifier", "5 rue à Modifier", 45.0, 4.0, []);
        var creationResponse = await admin.PostAsJsonAsync(
            "/api/restaurants", creationRequest, TestContext.Current.CancellationToken);
        var cree = await creationResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(cree);

        var modificationBody = new ModifierRestaurantBody("Restaurant Modifié", "6 rue Modifiée", 46.0, 5.0, []);

        var response = await admin.PutAsJsonAsync(
            $"/api/restaurants/{cree.Id}", modificationBody, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var listeResponse = await admin.GetAsync("/api/restaurants", TestContext.Current.CancellationToken);
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
    public async Task Put_UtilisateurSimple_Retourne403()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken); // premier inscrit => Admin

        var creationRequest = new CreerRestaurantRequest("Restaurant Protégé", "5 rue Protégée", 45.0, 4.0, []);
        var creationResponse = await admin.PostAsJsonAsync(
            "/api/restaurants", creationRequest, TestContext.Current.CancellationToken);
        var cree = await creationResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(cree);

        using var simple = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(simple, ct: TestContext.Current.CancellationToken); // second inscrit => Simple

        var modificationBody = new ModifierRestaurantBody("Tentative Non Autorisée", "5 rue Protégée", 45.0, 4.0, []);

        var response = await simple.PutAsJsonAsync(
            $"/api/restaurants/{cree.Id}", modificationBody, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Put_UtilisateurNonAuthentifie_Retourne401()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();

        var modificationBody = new ModifierRestaurantBody("Nom", "Adresse", 45.0, 4.0, []);

        var response = await client.PutAsJsonAsync(
            $"/api/restaurants/{Guid.NewGuid()}", modificationBody, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Put_AvecCategorieIdsValides_Retourne204EtRemplaceLesCategories()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        var categorieItalienne = CategorieSeedData.IdPour("Type de cuisine", "Italienne");
        var categorieTerrasse = CategorieSeedData.IdPour("Autres caractéristiques", "Terrasse");

        var creationRequest = new CreerRestaurantRequest(
            "Restaurant à Recatégoriser", "13 rue à Recatégoriser", 45.0, 4.0, [categorieItalienne]);
        var creationResponse = await admin.PostAsJsonAsync(
            "/api/restaurants", creationRequest, TestContext.Current.CancellationToken);
        var cree = await creationResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(cree);

        var modificationBody = new ModifierRestaurantBody(
            "Restaurant à Recatégoriser", "13 rue à Recatégoriser", 45.0, 4.0, [categorieTerrasse]);

        var response = await admin.PutAsJsonAsync(
            $"/api/restaurants/{cree.Id}", modificationBody, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var listeResponse = await admin.GetAsync("/api/restaurants", TestContext.Current.CancellationToken);
        var restaurants = await listeResponse.Content.ReadFromJsonAsync<List<RestaurantDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(restaurants);
        var modifie = Assert.Single(restaurants, r => r.Id == cree.Id);
        Assert.Equal(categorieTerrasse, Assert.Single(modifie.Categories).Id);
    }

    [Fact]
    public async Task Put_AvecCategorieIdInexistant_Retourne404()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        var creationRequest = new CreerRestaurantRequest("Restaurant à Ne Pas Modifier", "14 rue Ne Pas Modifier", 45.0, 4.0, []);
        var creationResponse = await admin.PostAsJsonAsync(
            "/api/restaurants", creationRequest, TestContext.Current.CancellationToken);
        var cree = await creationResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(cree);

        var modificationBody = new ModifierRestaurantBody(
            "Restaurant à Ne Pas Modifier", "14 rue Ne Pas Modifier", 45.0, 4.0, [Guid.NewGuid()]);

        var response = await admin.PutAsJsonAsync(
            $"/api/restaurants/{cree.Id}", modificationBody, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Put_RestaurantInexistant_Retourne404()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        var modificationBody = new ModifierRestaurantBody("Nom", "Adresse", 45.0, 4.0, []);

        var response = await admin.PutAsJsonAsync(
            $"/api/restaurants/{Guid.NewGuid()}", modificationBody, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Put_ConflitAvecUnAutreRestaurant_Retourne409()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        var premierRequest = new CreerRestaurantRequest("Restaurant Un", "7 rue Un", 45.0, 4.0, []);
        await admin.PostAsJsonAsync("/api/restaurants", premierRequest, TestContext.Current.CancellationToken);

        var secondRequest = new CreerRestaurantRequest("Restaurant Deux", "8 rue Deux", 45.0, 4.0, []);
        var secondResponse = await admin.PostAsJsonAsync(
            "/api/restaurants", secondRequest, TestContext.Current.CancellationToken);
        var second = await secondResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(second);

        var modificationBody = new ModifierRestaurantBody("Restaurant Un", "7 rue Un", 45.0, 4.0, []);

        var response = await admin.PutAsJsonAsync(
            $"/api/restaurants/{second.Id}", modificationBody, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Delete_AdminSupprimeUnRestaurantExistant_Retourne204EtLeRetireDeLaListe()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        var creationRequest = new CreerRestaurantRequest("Restaurant à Supprimer", "9 rue à Supprimer", 45.0, 4.0, []);
        var creationResponse = await admin.PostAsJsonAsync(
            "/api/restaurants", creationRequest, TestContext.Current.CancellationToken);
        var cree = await creationResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(cree);

        var response = await admin.DeleteAsync($"/api/restaurants/{cree.Id}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var listeResponse = await admin.GetAsync("/api/restaurants", TestContext.Current.CancellationToken);
        var restaurants = await listeResponse.Content.ReadFromJsonAsync<List<RestaurantDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(restaurants);
        Assert.DoesNotContain(restaurants, r => r.Id == cree.Id);
    }

    [Fact]
    public async Task Delete_UtilisateurSimple_Retourne403()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        var creationRequest = new CreerRestaurantRequest("Restaurant Protégé Suppression", "9 rue Protégée", 45.0, 4.0, []);
        var creationResponse = await admin.PostAsJsonAsync(
            "/api/restaurants", creationRequest, TestContext.Current.CancellationToken);
        var cree = await creationResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(cree);

        using var simple = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(simple, ct: TestContext.Current.CancellationToken);

        var response = await simple.DeleteAsync($"/api/restaurants/{cree.Id}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Delete_RestaurantInexistant_Retourne404()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        var response = await admin.DeleteAsync(
            $"/api/restaurants/{Guid.NewGuid()}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_RestaurantAvecVisites_SupprimeLesVisitesEnCascade()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        var creationRestaurant = new CreerRestaurantRequest(
            "Restaurant Avec Visite à Supprimer", "10 rue Cascade", 45.0, 4.0, []);
        var creationRestaurantResponse = await admin.PostAsJsonAsync(
            "/api/restaurants", creationRestaurant, TestContext.Current.CancellationToken);
        var restaurantCree = await creationRestaurantResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(restaurantCree);

        var enregistrerVisite = new EnregistrerVisiteBody(
            restaurantCree.Id, new DateOnly(2026, 7, 25), 5, "Très bon accueil", ["https://exemple.test/photo.jpg"]);
        await admin.PostAsJsonAsync("/api/visites", enregistrerVisite, TestContext.Current.CancellationToken);

        var response = await admin.DeleteAsync(
            $"/api/restaurants/{restaurantCree.Id}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var visitesResponse = await admin.GetAsync(
            $"/api/restaurants/{restaurantCree.Id}/visites", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, visitesResponse.StatusCode);
    }

    [Fact]
    public async Task PostPhoto_AdminAjouteUnePhoto_Retourne201EtLAssocieAuRestaurant()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        var creationRequest = new CreerRestaurantRequest("Restaurant à Photo", "15 rue de la Photo", 45.0, 4.0, []);
        var creationResponse = await admin.PostAsJsonAsync(
            "/api/restaurants", creationRequest, TestContext.Current.CancellationToken);
        var cree = await creationResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(cree);

        var body = new AjouterPhotoRestaurantBody("https://exemple.test/photo.jpg");

        var response = await admin.PostAsJsonAsync(
            $"/api/restaurants/{cree.Id}/photos", body, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var photoAjoutee = await response.Content.ReadFromJsonAsync<AjouterPhotoRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(photoAjoutee);
        Assert.NotEqual(Guid.Empty, photoAjoutee.PhotoId);

        var listeResponse = await admin.GetAsync("/api/restaurants", TestContext.Current.CancellationToken);
        var restaurants = await listeResponse.Content.ReadFromJsonAsync<List<RestaurantDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(restaurants);
        var restaurantAvecPhoto = Assert.Single(restaurants, r => r.Id == cree.Id);
        var photoDto = Assert.Single(restaurantAvecPhoto.Photos);
        Assert.Equal(photoAjoutee.PhotoId, photoDto.Id);
        Assert.Equal("https://exemple.test/photo.jpg", photoDto.Url);
    }

    [Fact]
    public async Task PostPhoto_RestaurantInexistant_Retourne404()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        var body = new AjouterPhotoRestaurantBody("https://exemple.test/photo.jpg");

        var response = await admin.PostAsJsonAsync(
            $"/api/restaurants/{Guid.NewGuid()}/photos", body, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task PostPhoto_UtilisateurSimple_Retourne403()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        var creationRequest = new CreerRestaurantRequest("Restaurant Photo Protégé", "16 rue Protégée", 45.0, 4.0, []);
        var creationResponse = await admin.PostAsJsonAsync(
            "/api/restaurants", creationRequest, TestContext.Current.CancellationToken);
        var cree = await creationResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(cree);

        using var simple = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(simple, ct: TestContext.Current.CancellationToken);

        var body = new AjouterPhotoRestaurantBody("https://exemple.test/photo.jpg");

        var response = await simple.PostAsJsonAsync(
            $"/api/restaurants/{cree.Id}/photos", body, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task PostPhoto_UtilisateurNonAuthentifie_Retourne401()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();

        var body = new AjouterPhotoRestaurantBody("https://exemple.test/photo.jpg");

        var response = await client.PostAsJsonAsync(
            $"/api/restaurants/{Guid.NewGuid()}/photos", body, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task DeletePhoto_AdminSupprimeUnePhotoExistante_Retourne204EtLaRetireDuRestaurant()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        var creationRequest = new CreerRestaurantRequest("Restaurant à Photo à Supprimer", "17 rue à Supprimer", 45.0, 4.0, []);
        var creationResponse = await admin.PostAsJsonAsync(
            "/api/restaurants", creationRequest, TestContext.Current.CancellationToken);
        var cree = await creationResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(cree);

        var photoResponse = await admin.PostAsJsonAsync(
            $"/api/restaurants/{cree.Id}/photos",
            new AjouterPhotoRestaurantBody("https://exemple.test/photo.jpg"),
            TestContext.Current.CancellationToken);
        var photoAjoutee = await photoResponse.Content.ReadFromJsonAsync<AjouterPhotoRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(photoAjoutee);

        var response = await admin.DeleteAsync(
            $"/api/restaurants/{cree.Id}/photos/{photoAjoutee.PhotoId}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var listeResponse = await admin.GetAsync("/api/restaurants", TestContext.Current.CancellationToken);
        var restaurants = await listeResponse.Content.ReadFromJsonAsync<List<RestaurantDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(restaurants);
        var restaurantSansPhoto = Assert.Single(restaurants, r => r.Id == cree.Id);
        Assert.Empty(restaurantSansPhoto.Photos);
    }

    [Fact]
    public async Task DeletePhoto_RestaurantInexistant_Retourne404()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        var response = await admin.DeleteAsync(
            $"/api/restaurants/{Guid.NewGuid()}/photos/{Guid.NewGuid()}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeletePhoto_UtilisateurSimple_Retourne403()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        var creationRequest = new CreerRestaurantRequest("Restaurant Photo Protégée Suppr", "18 rue Protégée", 45.0, 4.0, []);
        var creationResponse = await admin.PostAsJsonAsync(
            "/api/restaurants", creationRequest, TestContext.Current.CancellationToken);
        var cree = await creationResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(cree);

        var photoResponse = await admin.PostAsJsonAsync(
            $"/api/restaurants/{cree.Id}/photos",
            new AjouterPhotoRestaurantBody("https://exemple.test/photo.jpg"),
            TestContext.Current.CancellationToken);
        var photoAjoutee = await photoResponse.Content.ReadFromJsonAsync<AjouterPhotoRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(photoAjoutee);

        using var simple = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(simple, ct: TestContext.Current.CancellationToken);

        var response = await simple.DeleteAsync(
            $"/api/restaurants/{cree.Id}/photos/{photoAjoutee.PhotoId}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task PutPhotoPrincipale_AdminMarqueUnePhotoCommePrincipale_Retourne204EtLaMarqueDansLeDto()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        var creationRequest = new CreerRestaurantRequest("Restaurant Photo Principale", "19 rue Principale", 45.0, 4.0, []);
        var creationResponse = await admin.PostAsJsonAsync(
            "/api/restaurants", creationRequest, TestContext.Current.CancellationToken);
        var cree = await creationResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(cree);

        var photoResponse = await admin.PostAsJsonAsync(
            $"/api/restaurants/{cree.Id}/photos",
            new AjouterPhotoRestaurantBody("https://exemple.test/photo.jpg"),
            TestContext.Current.CancellationToken);
        var photoAjoutee = await photoResponse.Content.ReadFromJsonAsync<AjouterPhotoRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(photoAjoutee);

        var response = await admin.PutAsync(
            $"/api/restaurants/{cree.Id}/photos/{photoAjoutee.PhotoId}/principale", null, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var listeResponse = await admin.GetAsync("/api/restaurants", TestContext.Current.CancellationToken);
        var restaurants = await listeResponse.Content.ReadFromJsonAsync<List<RestaurantDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(restaurants);
        var restaurantModifie = Assert.Single(restaurants, r => r.Id == cree.Id);
        var photoDto = Assert.Single(restaurantModifie.Photos);
        Assert.True(photoDto.EstPrincipale);
    }

    [Fact]
    public async Task PutPhotoPrincipale_RestaurantInexistant_Retourne404()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        var response = await admin.PutAsync(
            $"/api/restaurants/{Guid.NewGuid()}/photos/{Guid.NewGuid()}/principale", null, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task PutPhotoPrincipale_PhotoInexistante_Retourne404()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        var creationRequest = new CreerRestaurantRequest("Restaurant Sans Cette Photo", "20 rue Sans Photo", 45.0, 4.0, []);
        var creationResponse = await admin.PostAsJsonAsync(
            "/api/restaurants", creationRequest, TestContext.Current.CancellationToken);
        var cree = await creationResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(cree);

        var response = await admin.PutAsync(
            $"/api/restaurants/{cree.Id}/photos/{Guid.NewGuid()}/principale", null, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task PutPhotoPrincipale_UtilisateurSimple_Retourne403()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        var creationRequest = new CreerRestaurantRequest("Restaurant Photo Principale Protégée", "21 rue Protégée", 45.0, 4.0, []);
        var creationResponse = await admin.PostAsJsonAsync(
            "/api/restaurants", creationRequest, TestContext.Current.CancellationToken);
        var cree = await creationResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(cree);

        var photoResponse = await admin.PostAsJsonAsync(
            $"/api/restaurants/{cree.Id}/photos",
            new AjouterPhotoRestaurantBody("https://exemple.test/photo.jpg"),
            TestContext.Current.CancellationToken);
        var photoAjoutee = await photoResponse.Content.ReadFromJsonAsync<AjouterPhotoRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(photoAjoutee);

        using var simple = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(simple, ct: TestContext.Current.CancellationToken);

        var response = await simple.PutAsync(
            $"/api/restaurants/{cree.Id}/photos/{photoAjoutee.PhotoId}/principale", null, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
