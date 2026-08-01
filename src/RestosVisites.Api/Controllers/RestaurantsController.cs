using Microsoft.AspNetCore.Mvc;
using RestosVisites.Application.UseCases.CreerRestaurant;
using RestosVisites.Application.UseCases.ListerRestaurants;
using RestosVisites.Application.UseCases.ListerVisitesRestaurant;
using RestosVisites.Application.UseCases.ModifierRestaurant;
using RestosVisites.Application.UseCases.SupprimerRestaurant;

namespace RestosVisites.Api.Controllers;

[ApiController]
[Route("api/restaurants")]
public sealed class RestaurantsController : ControllerBase
{
    private readonly CreerRestaurant _creerRestaurant;
    private readonly ListerRestaurants _listerRestaurants;
    private readonly ListerVisitesRestaurant _listerVisitesRestaurant;
    private readonly ModifierRestaurant _modifierRestaurant;
    private readonly SupprimerRestaurant _supprimerRestaurant;

    public RestaurantsController(
        CreerRestaurant creerRestaurant,
        ListerRestaurants listerRestaurants,
        ListerVisitesRestaurant listerVisitesRestaurant,
        ModifierRestaurant modifierRestaurant,
        SupprimerRestaurant supprimerRestaurant)
    {
        _creerRestaurant = creerRestaurant;
        _listerRestaurants = listerRestaurants;
        _listerVisitesRestaurant = listerVisitesRestaurant;
        _modifierRestaurant = modifierRestaurant;
        _supprimerRestaurant = supprimerRestaurant;
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

    /// <summary>Modifie un restaurant existant.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Modifier(Guid id, ModifierRestaurantBody body, CancellationToken ct)
    {
        var request = new ModifierRestaurantRequest(id, body.Nom, body.Adresse, body.Latitude, body.Longitude, body.CategorieIds);
        await _modifierRestaurant.ExecuterAsync(request, ct);

        return NoContent();
    }

    /// <summary>Supprime un restaurant existant (et ses visites, en cascade).</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Supprimer(Guid id, CancellationToken ct)
    {
        await _supprimerRestaurant.ExecuterAsync(new SupprimerRestaurantRequest(id), ct);

        return NoContent();
    }
}

/// <summary>Corps de requête pour la modification d'un restaurant (l'identifiant provient de l'URL).</summary>
public sealed record ModifierRestaurantBody(
    string Nom,
    string Adresse,
    double Latitude,
    double Longitude,
    IReadOnlyCollection<Guid> CategorieIds);
