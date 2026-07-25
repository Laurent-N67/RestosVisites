using Microsoft.AspNetCore.Mvc;
using RestosVisites.Application.UseCases.EnregistrerVisite;

namespace RestosVisites.Api.Controllers;

[ApiController]
[Route("api/visites")]
public sealed class VisitesController : ControllerBase
{
    private readonly EnregistrerVisite _enregistrerVisite;

    public VisitesController(EnregistrerVisite enregistrerVisite)
    {
        _enregistrerVisite = enregistrerVisite;
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
}
