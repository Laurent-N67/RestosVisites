using Microsoft.AspNetCore.Mvc;
using RestosVisites.Application.UseCases.EnregistrerVisite;
using RestosVisites.Application.UseCases.ListerToutesLesVisites;
using RestosVisites.Application.UseCases.ListerVisitesRestaurant;
using RestosVisites.Application.UseCases.ModifierVisite;
using RestosVisites.Application.UseCases.SupprimerVisite;

namespace RestosVisites.Api.Controllers;

[ApiController]
[Route("api/visites")]
public sealed class VisitesController : ControllerBase
{
    private readonly EnregistrerVisite _enregistrerVisite;
    private readonly ListerToutesLesVisites _listerToutesLesVisites;
    private readonly ModifierVisite _modifierVisite;
    private readonly SupprimerVisite _supprimerVisite;

    public VisitesController(
        EnregistrerVisite enregistrerVisite,
        ListerToutesLesVisites listerToutesLesVisites,
        ModifierVisite modifierVisite,
        SupprimerVisite supprimerVisite)
    {
        _enregistrerVisite = enregistrerVisite;
        _listerToutesLesVisites = listerToutesLesVisites;
        _modifierVisite = modifierVisite;
        _supprimerVisite = supprimerVisite;
    }

    /// <summary>Liste l'ensemble des visites, tous restaurants confondus.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<VisiteDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<VisiteDto>>> Lister(CancellationToken ct)
    {
        var visites = await _listerToutesLesVisites.ExecuterAsync(ct);

        return Ok(visites);
    }

    /// <summary>Enregistre une nouvelle visite pour un restaurant existant.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(EnregistrerVisiteResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EnregistrerVisiteResponse>> Enregistrer(EnregistrerVisiteRequest request, CancellationToken ct)
    {
        var response = await _enregistrerVisite.ExecuterAsync(request, ct);

        return Created($"/api/visites/{response.Id}", response);
    }

    /// <summary>Modifie une visite existante.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Modifier(Guid id, ModifierVisiteBody body, CancellationToken ct)
    {
        var request = new ModifierVisiteRequest(
            id, body.Date, body.Note, body.Commentaire, body.UrlsPhotos);
        await _modifierVisite.ExecuterAsync(request, ct);

        return NoContent();
    }

    /// <summary>Supprime une visite existante.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Supprimer(Guid id, CancellationToken ct)
    {
        await _supprimerVisite.ExecuterAsync(new SupprimerVisiteRequest(id), ct);

        return NoContent();
    }
}

/// <summary>Corps de requête pour la modification d'une visite (l'identifiant provient de l'URL).</summary>
public sealed record ModifierVisiteBody(
    DateOnly Date,
    int Note,
    string? Commentaire,
    IReadOnlyList<string> UrlsPhotos);
