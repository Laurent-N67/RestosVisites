using System.Net;
using System.Net.Http.Json;
using RestosVisites.Application.UseCases.ListerCategories;
using RestosVisites.Infrastructure.Persistence.Seed;

namespace RestosVisites.Api.Tests.Controllers;

public sealed class CategoriesControllerTests : IClassFixture<RestosVisitesWebApplicationFactory>
{
    private readonly HttpClient _client;

    public CategoriesControllerTests(RestosVisitesWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Get_RetourneLeCatalogueComplet()
    {
        var response = await _client.GetAsync("/api/categories", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var categories = await response.Content.ReadFromJsonAsync<List<CategorieDto>>(TestContext.Current.CancellationToken);
        Assert.NotNull(categories);
        Assert.Equal(CategorieSeedData.Items.Count, categories.Count);

        var categorieAttendue = CategorieSeedData.IdPour("Type de cuisine", "Italienne");
        Assert.Contains(categories, c => c.Id == categorieAttendue && c.Nom == "Italienne" && c.Groupe == "Type de cuisine");
    }
}
