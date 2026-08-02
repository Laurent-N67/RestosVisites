using System.Net;
using System.Net.Http.Json;
using RestosVisites.Application.UseCases.ListerCategories;
using RestosVisites.Infrastructure.Persistence.Seed;

namespace RestosVisites.Api.Tests.Controllers;

public sealed class CategoriesControllerTests : IClassFixture<RestosVisitesWebApplicationFactory>
{
    private readonly RestosVisitesWebApplicationFactory _factory;

    public CategoriesControllerTests(RestosVisitesWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Get_UtilisateurAuthentifie_RetourneLeCatalogueComplet()
    {
        using var client = _factory.CreateClient();
        await AuthTestHelper.InscrireEtConnecterAsync(client, ct: TestContext.Current.CancellationToken);

        var response = await client.GetAsync("/api/categories", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var categories = await response.Content.ReadFromJsonAsync<List<CategorieDto>>(TestContext.Current.CancellationToken);
        Assert.NotNull(categories);
        Assert.Equal(CategorieSeedData.Items.Count, categories.Count);

        var categorieAttendue = CategorieSeedData.IdPour("Type de cuisine", "Italienne");
        Assert.Contains(categories, c => c.Id == categorieAttendue && c.Nom == "Italienne" && c.Groupe == "Type de cuisine");
    }

    [Fact]
    public async Task Get_UtilisateurNonAuthentifie_Retourne401()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/categories", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
