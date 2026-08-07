using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestosVisites.Application.UseCases.AjouterPhotoRestaurant;
using RestosVisites.Application.UseCases.CreerRestaurant;
using RestosVisites.Application.UseCases.DefinirPhotoPrincipaleRestaurant;
using RestosVisites.Application.UseCases.ListerRestaurants;
using RestosVisites.Application.UseCases.ListerVisitesRestaurant;
using RestosVisites.Application.UseCases.ModifierRestaurant;
using RestosVisites.Application.UseCases.SupprimerPhotoRestaurant;
using RestosVisites.Application.UseCases.SupprimerRestaurant;

namespace RestosVisites.Api.Controllers;

[ApiController]
[Route("api/restaurants")]
[Authorize]
public sealed class RestaurantsController : ControllerBase
{
    private readonly CreerRestaurant _creerRestaurant;
    private readonly ListerRestaurants _listerRestaurants;
    private readonly ListerVisitesRestaurant _listerVisitesRestaurant;
    private readonly ModifierRestaurant _modifierRestaurant;
    private readonly SupprimerRestaurant _supprimerRestaurant;
    private readonly AjouterPhotoRestaurant _ajouterPhotoRestaurant;
    private readonly SupprimerPhotoRestaurant _supprimerPhotoRestaurant;
    private readonly DefinirPhotoPrincipaleRestaurant _definirPhotoPrincipaleRestaurant;

    public RestaurantsController(
        CreerRestaurant creerRestaurant,
        ListerRestaurants listerRestaurants,
        ListerVisitesRestaurant listerVisitesRestaurant,
        ModifierRestaurant modifierRestaurant,
        SupprimerRestaurant supprimerRestaurant,
        AjouterPhotoRestaurant ajouterPhotoRestaurant,
        SupprimerPhotoRestaurant supprimerPhotoRestaurant,
        DefinirPhotoPrincipaleRestaurant definirPhotoPrincipaleRestaurant)
    {
        _creerRestaurant = creerRestaurant;
        _listerRestaurants = listerRestaurants;
        _listerVisitesRestaurant = listerVisitesRestaurant;
        _modifierRestaurant = modifierRestaurant;
        _supprimerRestaurant = supprimerRestaurant;
        _ajouterPhotoRestaurant = ajouterPhotoRestaurant;
        _supprimerPhotoRestaurant = supprimerPhotoRestaurant;
        _definirPhotoPrincipaleRestaurant = definirPhotoPrincipaleRestaurant;
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

    /// <summary>Modifie un restaurant existant. Réservé aux Admins.</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Modifier(Guid id, ModifierRestaurantBody body, CancellationToken ct)
    {
        var request = new ModifierRestaurantRequest(
            id, body.Nom, body.Adresse, body.Latitude, body.Longitude, body.CategorieIds,
            body.Description, body.Telephone, body.SiteWeb, body.Horaires);
        await _modifierRestaurant.ExecuterAsync(request, ct);

        return NoContent();
    }

    /// <summary>Supprime un restaurant existant (et ses visites, en cascade). Réservé aux Admins.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Supprimer(Guid id, CancellationToken ct)
    {
        await _supprimerRestaurant.ExecuterAsync(new SupprimerRestaurantRequest(id), ct);

        return NoContent();
    }

    /// <summary>Ajoute une photo à un restaurant existant. Réservé aux Admins.</summary>
    [HttpPost("{id:guid}/photos")]
    [Authorize(Policy = "Admin")]
    [ProducesResponseType(typeof(AjouterPhotoRestaurantResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AjouterPhotoRestaurantResponse>> AjouterPhoto(Guid id, AjouterPhotoRestaurantBody body, CancellationToken ct)
    {
        var request = new AjouterPhotoRestaurantRequest(id, body.Url);
        var response = await _ajouterPhotoRestaurant.ExecuterAsync(request, ct);

        return Created($"/api/restaurants/{id}/photos/{response.PhotoId}", response);
    }

    /// <summary>Supprime une photo d'un restaurant existant. Réservé aux Admins.</summary>
    [HttpDelete("{id:guid}/photos/{photoId:guid}")]
    [Authorize(Policy = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SupprimerPhoto(Guid id, Guid photoId, CancellationToken ct)
    {
        await _supprimerPhotoRestaurant.ExecuterAsync(new SupprimerPhotoRestaurantRequest(id, photoId), ct);

        return NoContent();
    }

    /// <summary>Marque une photo d'un restaurant comme sa photo principale. Réservé aux Admins.</summary>
    [HttpPut("{id:guid}/photos/{photoId:guid}/principale")]
    [Authorize(Policy = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DefinirPhotoPrincipale(Guid id, Guid photoId, CancellationToken ct)
    {
        await _definirPhotoPrincipaleRestaurant.ExecuterAsync(new DefinirPhotoPrincipaleRestaurantRequest(id, photoId), ct);

        return NoContent();
    }
}

/// <summary>Corps de requête pour la modification d'un restaurant (l'identifiant provient de l'URL).</summary>
public sealed record ModifierRestaurantBody(
    string Nom,
    string Adresse,
    double Latitude,
    double Longitude,
    IReadOnlyCollection<Guid> CategorieIds,
    string? Description = null,
    string? Telephone = null,
    string? SiteWeb = null,
    string? Horaires = null);

/// <summary>Corps de requête pour l'ajout d'une photo à un restaurant.</summary>
public sealed record AjouterPhotoRestaurantBody(string Url);
