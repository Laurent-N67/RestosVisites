using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestosVisites.Application.UseCases.RecompresserPhotosExistantes;

namespace RestosVisites.Api.Controllers;

/// <summary>
/// Opérations de maintenance ponctuelles, toutes réservées aux Admins et distinctes des endpoints
/// métier habituels (ex : upload direct de photos via <see cref="PhotosController"/>).
/// </summary>
[ApiController]
[Route("api/maintenance")]
[Authorize(Policy = "Admin")]
public sealed class MaintenanceController : ControllerBase
{
    private readonly RecompresserPhotosExistantes _recompresserPhotosExistantes;

    public MaintenanceController(RecompresserPhotosExistantes recompresserPhotosExistantes)
    {
        _recompresserPhotosExistantes = recompresserPhotosExistantes;
    }

    /// <summary>
    /// Recompresse rétroactivement toutes les photos existantes qui n'ont pas encore été prises en
    /// charge par le pipeline de compression WebP (photos uploadées avant le 2026-08-03).
    /// </summary>
    [HttpPost("recompresser-photos")]
    [ProducesResponseType(typeof(RecompresserPhotosResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<RecompresserPhotosResponse>> RecompresserPhotos(CancellationToken ct)
    {
        var resultat = await _recompresserPhotosExistantes.ExecuterAsync(ct);

        return Ok(new RecompresserPhotosResponse(
            resultat.PhotosRecompressees,
            resultat.TailleAvantOctetsTotale,
            resultat.TailleApresOctetsTotale,
            resultat.PhotosEnErreur));
    }
}

/// <summary>Réponse retournée après une recompression rétroactive des photos existantes.</summary>
public sealed record RecompresserPhotosResponse(
    int PhotosRecompressees,
    long TailleAvantOctetsTotale,
    long TailleApresOctetsTotale,
    int PhotosEnErreur);
