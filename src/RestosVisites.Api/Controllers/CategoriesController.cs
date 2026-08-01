using Microsoft.AspNetCore.Mvc;
using RestosVisites.Application.UseCases.ListerCategories;

namespace RestosVisites.Api.Controllers;

[ApiController]
[Route("api/categories")]
public sealed class CategoriesController : ControllerBase
{
    private readonly ListerCategories _listerCategories;

    public CategoriesController(ListerCategories listerCategories)
    {
        _listerCategories = listerCategories;
    }

    /// <summary>Liste l'ensemble du catalogue de catégories prédéfinies.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<CategorieDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CategorieDto>>> Lister(CancellationToken ct)
    {
        var categories = await _listerCategories.ExecuterAsync(ct);

        return Ok(categories);
    }
}
