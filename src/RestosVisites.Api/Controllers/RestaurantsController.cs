using Microsoft.AspNetCore.Mvc;
using RestosVisites.Application.UseCases.CreerRestaurant;
using RestosVisites.Application.UseCases.ListerRestaurants;
using RestosVisites.Application.UseCases.ListerVisitesRestaurant;

namespace RestosVisites.Api.Controllers;

[ApiController]
[Route("api/restaurants")]
public sealed class RestaurantsController : ControllerBase
{
    private readonly CreerRestaurant _creerRestaurant;
    private readonly ListerRestaurants _listerRestaurants;
    private readonly ListerVisitesRestaurant _listerVisitesRestaurant;

    public RestaurantsController(
        CreerRestaurant creerRestaurant,
        ListerRestaurants listerRestaurants,
        ListerVisitesRestaurant listerVisitesRestaurant)
    {
        _creerRestaurant = creerRestaurant;
        _listerRestaurants = listerRestaurants;
        _listerVisitesRestaurant = listerVisitesRestaurant;
    }

    /// <summary>Crée un nouveau restaurant.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(CreerRestaurantResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CreerRestaurantResponse>> Creer(CreerRestaurantRequest request, CancellationToken ct)
    {
        var response = await _creerRestaurant.ExecuterAsync(request, ct);

        return Created($"/api/restaurants/{response.Id}", response);
    }

    /// <summary>Liste l'ensemble des restaurants.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<RestaurantDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<RestaurantDto>>> Lister(CancellationToken ct)
    {
        var restaurants = await _listerRestaurants.ExecuterAsync(ct);

        return Ok(restaurants);
    }

    /// <summary>Liste les visites d'un restaurant.</summary>
    [HttpGet("{id:guid}/visites")]
    [ProducesResponseType(typeof(IReadOnlyList<VisiteDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<VisiteDto>>> ListerVisites(Guid id, CancellationToken ct)
    {
        var visites = await _listerVisitesRestaurant.ExecuterAsync(id, ct);

        return Ok(visites);
    }
}
