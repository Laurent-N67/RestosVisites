using System.Net;
using System.Net.Http.Json;
using RestosVisites.Api.Controllers;
using RestosVisites.Application.UseCases.CreerRestaurant;
using RestosVisites.Application.UseCases.EnregistrerVisite;
using RestosVisites.Application.UseCases.ListerVisitesRestaurant;

namespace RestosVisites.Api.Tests.Controllers;

/// <summary>
/// Chaque test utilise sa propre factory (base en mémoire dédiée), pour les mêmes raisons de
/// déterminisme (rôle du premier inscrit) qu'expliqué dans <see cref="RestaurantsControllerTests"/>.
/// </summary>
public sealed class VisitesControllerTests
{
    [Fact]
    public async Task Get_ListeVide_Retourne200EtListeVide()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(client, ct: TestContext.Current.CancellationToken);

        var response = await client.GetAsync("/api/visites", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var visites = await response.Content.ReadFromJsonAsync<List<VisiteDto>>(TestContext.Current.CancellationToken);
        Assert.NotNull(visites);
        Assert.Empty(visites);
    }

    [Fact]
    public async Task Get_UtilisateurNonAuthentifie_Retourne401()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/visites", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Get_AvecVisitesSurPlusieursRestaurants_RetourneToutesLesVisites()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();
        var utilisateur = await AuthTestHelper.InscrireEtConnecterAsync(client, ct: TestContext.Current.CancellationToken);

        var creationRestaurant1 = new CreerRestaurantRequest(
            "Restaurant Liste 1", "1 rue de la Liste", 45.0, 4.0, []);
        var creationRestaurant1Response = await client.PostAsJsonAsync(
            "/api/restaurants", creationRestaurant1, TestContext.Current.CancellationToken);
        var restaurant1 = await creationRestaurant1Response.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(restaurant1);

        var creationRestaurant2 = new CreerRestaurantRequest(
            "Restaurant Liste 2", "2 rue de la Liste", 45.1, 4.1, []);
        var creationRestaurant2Response = await client.PostAsJsonAsync(
            "/api/restaurants", creationRestaurant2, TestContext.Current.CancellationToken);
        var restaurant2 = await creationRestaurant2Response.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(restaurant2);

        var creationVisite1 = new EnregistrerVisiteBody(
            restaurant1.Id, new DateOnly(2026, 7, 25), 4, "Bonne visite", []);
        var creationVisite1Response = await client.PostAsJsonAsync(
            "/api/visites", creationVisite1, TestContext.Current.CancellationToken);
        var visite1 = await creationVisite1Response.Content.ReadFromJsonAsync<EnregistrerVisiteResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(visite1);

        var creationVisite2 = new EnregistrerVisiteBody(
            restaurant2.Id, new DateOnly(2026, 7, 26), 5, "Excellente visite", []);
        var creationVisite2Response = await client.PostAsJsonAsync(
            "/api/visites", creationVisite2, TestContext.Current.CancellationToken);
        var visite2 = await creationVisite2Response.Content.ReadFromJsonAsync<EnregistrerVisiteResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(visite2);

        var response = await client.GetAsync("/api/visites", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var visites = await response.Content.ReadFromJsonAsync<List<VisiteDto>>(TestContext.Current.CancellationToken);
        Assert.NotNull(visites);
        Assert.Contains(visites, v => v.Id == visite1.Id && v.RestaurantId == restaurant1.Id && v.UtilisateurId == utilisateur.Id);
        Assert.Contains(visites, v => v.Id == visite2.Id && v.RestaurantId == restaurant2.Id && v.UtilisateurId == utilisateur.Id);
    }

    [Fact]
    public async Task Post_AvecRestaurantExistant_Retourne201()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(client, ct: TestContext.Current.CancellationToken);

        var creationRestaurant = new CreerRestaurantRequest("Restaurant Visite", "1 rue de la Visite", 45.0, 4.0, []);
        var creationRestaurantResponse = await client.PostAsJsonAsync(
            "/api/restaurants", creationRestaurant, TestContext.Current.CancellationToken);
        var restaurantCree = await creationRestaurantResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(restaurantCree);

        var request = new EnregistrerVisiteBody(
            restaurantCree.Id,
            new DateOnly(2026, 7, 25),
            4,
            "Bonne visite",
            ["https://exemple.test/photo1.jpg", "https://exemple.test/photo2.jpg"]);

        var response = await client.PostAsJsonAsync("/api/visites", request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<EnregistrerVisiteResponse>(TestContext.Current.CancellationToken);
        Assert.NotNull(body);
        Assert.NotEqual(Guid.Empty, body.Id);
    }

    [Fact]
    public async Task Post_UtilisateurNonAuthentifie_Retourne401()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();

        var request = new EnregistrerVisiteBody(Guid.NewGuid(), new DateOnly(2026, 7, 25), 4, null, []);

        var response = await client.PostAsJsonAsync("/api/visites", request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Post_AvecRestaurantIdInexistant_Retourne404()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(client, ct: TestContext.Current.CancellationToken);

        var request = new EnregistrerVisiteBody(Guid.NewGuid(), new DateOnly(2026, 7, 25), 3, null, []);

        var response = await client.PostAsJsonAsync("/api/visites", request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Put_AuteurModifieSaPropreVisite_Retourne204EtModifieLesPhotos()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(client, ct: TestContext.Current.CancellationToken);

        var creationRestaurant = new CreerRestaurantRequest(
            "Restaurant Visite À Modifier", "2 rue de la Modification", 45.0, 4.0, []);
        var creationRestaurantResponse = await client.PostAsJsonAsync(
            "/api/restaurants", creationRestaurant, TestContext.Current.CancellationToken);
        var restaurantCree = await creationRestaurantResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(restaurantCree);

        var creationVisite = new EnregistrerVisiteBody(
            restaurantCree.Id,
            new DateOnly(2026, 7, 25),
            4,
            "Bonne visite",
            ["https://exemple.test/photo1.jpg"]);
        var creationVisiteResponse = await client.PostAsJsonAsync(
            "/api/visites", creationVisite, TestContext.Current.CancellationToken);
        var visiteCreee = await creationVisiteResponse.Content.ReadFromJsonAsync<EnregistrerVisiteResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(visiteCreee);

        var modificationBody = new ModifierVisiteBody(
            new DateOnly(2026, 7, 26),
            5,
            "Visite modifiée",
            ["https://exemple.test/photo2.jpg"]);

        var response = await client.PutAsJsonAsync(
            $"/api/visites/{visiteCreee.Id}", modificationBody, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var visitesResponse = await client.GetAsync(
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
    public async Task Put_UtilisateurNiAuteurNiAdmin_Retourne403()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var auteur = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(auteur, ct: TestContext.Current.CancellationToken); // premier inscrit => Admin, mais sert ici d'auteur

        var creationRestaurant = new CreerRestaurantRequest(
            "Restaurant Visite Protégée", "2 rue Protégée", 45.0, 4.0, []);
        var creationRestaurantResponse = await auteur.PostAsJsonAsync(
            "/api/restaurants", creationRestaurant, TestContext.Current.CancellationToken);
        var restaurantCree = await creationRestaurantResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(restaurantCree);

        var creationVisite = new EnregistrerVisiteBody(restaurantCree.Id, new DateOnly(2026, 7, 25), 4, "Visite", []);
        var creationVisiteResponse = await auteur.PostAsJsonAsync(
            "/api/visites", creationVisite, TestContext.Current.CancellationToken);
        var visiteCreee = await creationVisiteResponse.Content.ReadFromJsonAsync<EnregistrerVisiteResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(visiteCreee);

        using var autreUtilisateur = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(autreUtilisateur, ct: TestContext.Current.CancellationToken); // second inscrit => Simple

        var modificationBody = new ModifierVisiteBody(new DateOnly(2026, 7, 26), 5, "Tentative non autorisée", []);

        var response = await autreUtilisateur.PutAsJsonAsync(
            $"/api/visites/{visiteCreee.Id}", modificationBody, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Put_AdminModifieLaVisiteDeQuelquUnDautre_Reussit()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken); // premier inscrit => Admin

        using var auteur = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(auteur, ct: TestContext.Current.CancellationToken); // second inscrit => Simple

        var creationRestaurant = new CreerRestaurantRequest(
            "Restaurant Modération", "2 rue Modération", 45.0, 4.0, []);
        var creationRestaurantResponse = await admin.PostAsJsonAsync(
            "/api/restaurants", creationRestaurant, TestContext.Current.CancellationToken);
        var restaurantCree = await creationRestaurantResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(restaurantCree);

        var creationVisite = new EnregistrerVisiteBody(restaurantCree.Id, new DateOnly(2026, 7, 25), 4, "Visite", []);
        var creationVisiteResponse = await auteur.PostAsJsonAsync(
            "/api/visites", creationVisite, TestContext.Current.CancellationToken);
        var visiteCreee = await creationVisiteResponse.Content.ReadFromJsonAsync<EnregistrerVisiteResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(visiteCreee);

        var modificationBody = new ModifierVisiteBody(new DateOnly(2026, 7, 26), 5, "Modéré par un admin", []);

        var response = await admin.PutAsJsonAsync(
            $"/api/visites/{visiteCreee.Id}", modificationBody, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task Put_VisiteInexistante_Retourne404()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(client, ct: TestContext.Current.CancellationToken);

        var modificationBody = new ModifierVisiteBody(new DateOnly(2026, 7, 25), 3, null, []);

        var response = await client.PutAsJsonAsync(
            $"/api/visites/{Guid.NewGuid()}", modificationBody, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_AuteurSupprimeSaPropreVisite_Retourne204()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(client, ct: TestContext.Current.CancellationToken);

        var creationRestaurant = new CreerRestaurantRequest(
            "Restaurant Visite À Supprimer", "3 rue de la Suppression", 45.0, 4.0, []);
        var creationRestaurantResponse = await client.PostAsJsonAsync(
            "/api/restaurants", creationRestaurant, TestContext.Current.CancellationToken);
        var restaurantCree = await creationRestaurantResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(restaurantCree);

        var creationVisite = new EnregistrerVisiteBody(
            restaurantCree.Id,
            new DateOnly(2026, 7, 25),
            4,
            "Bonne visite",
            ["https://exemple.test/photo1.jpg"]);
        var creationVisiteResponse = await client.PostAsJsonAsync(
            "/api/visites", creationVisite, TestContext.Current.CancellationToken);
        var visiteCreee = await creationVisiteResponse.Content.ReadFromJsonAsync<EnregistrerVisiteResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(visiteCreee);

        var response = await client.DeleteAsync($"/api/visites/{visiteCreee.Id}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var visitesResponse = await client.GetAsync(
            $"/api/restaurants/{restaurantCree.Id}/visites", TestContext.Current.CancellationToken);
        var visites = await visitesResponse.Content.ReadFromJsonAsync<List<VisiteDto>>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(visites);
        Assert.Empty(visites);
    }

    [Fact]
    public async Task Delete_UtilisateurNiAuteurNiAdmin_Retourne403()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var auteur = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(auteur, ct: TestContext.Current.CancellationToken);

        var creationRestaurant = new CreerRestaurantRequest(
            "Restaurant Visite Protégée Suppression", "3 rue Protégée", 45.0, 4.0, []);
        var creationRestaurantResponse = await auteur.PostAsJsonAsync(
            "/api/restaurants", creationRestaurant, TestContext.Current.CancellationToken);
        var restaurantCree = await creationRestaurantResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(restaurantCree);

        var creationVisite = new EnregistrerVisiteBody(restaurantCree.Id, new DateOnly(2026, 7, 25), 4, "Visite", []);
        var creationVisiteResponse = await auteur.PostAsJsonAsync(
            "/api/visites", creationVisite, TestContext.Current.CancellationToken);
        var visiteCreee = await creationVisiteResponse.Content.ReadFromJsonAsync<EnregistrerVisiteResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(visiteCreee);

        using var autreUtilisateur = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(autreUtilisateur, ct: TestContext.Current.CancellationToken);

        var response = await autreUtilisateur.DeleteAsync($"/api/visites/{visiteCreee.Id}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Delete_AdminSupprimeLaVisiteDeQuelquUnDautre_Reussit()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var admin = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(admin, ct: TestContext.Current.CancellationToken);

        using var auteur = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(auteur, ct: TestContext.Current.CancellationToken);

        var creationRestaurant = new CreerRestaurantRequest(
            "Restaurant Modération Suppression", "3 rue Modération", 45.0, 4.0, []);
        var creationRestaurantResponse = await admin.PostAsJsonAsync(
            "/api/restaurants", creationRestaurant, TestContext.Current.CancellationToken);
        var restaurantCree = await creationRestaurantResponse.Content.ReadFromJsonAsync<CreerRestaurantResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(restaurantCree);

        var creationVisite = new EnregistrerVisiteBody(restaurantCree.Id, new DateOnly(2026, 7, 25), 4, "Visite", []);
        var creationVisiteResponse = await auteur.PostAsJsonAsync(
            "/api/visites", creationVisite, TestContext.Current.CancellationToken);
        var visiteCreee = await creationVisiteResponse.Content.ReadFromJsonAsync<EnregistrerVisiteResponse>(
            TestContext.Current.CancellationToken);
        Assert.NotNull(visiteCreee);

        var response = await admin.DeleteAsync($"/api/visites/{visiteCreee.Id}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task Delete_VisiteInexistante_Retourne404()
    {
        using var factory = new RestosVisitesWebApplicationFactory();
        using var client = factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(client, ct: TestContext.Current.CancellationToken);

        var response = await client.DeleteAsync(
            $"/api/visites/{Guid.NewGuid()}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
