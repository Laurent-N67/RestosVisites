using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestosVisites.Application.UseCases.ChangerRole;
using RestosVisites.Application.UseCases.ListerUtilisateursAvecFavoris;
using RestosVisites.Domain.Enums;

namespace RestosVisites.Api.Controllers;

/// <summary>Annuaire des utilisateurs et de leurs favoris, et changement de rôle (réservé aux Admins).</summary>
[ApiController]
[Route("api/utilisateurs")]
[Authorize]
public sealed class UtilisateursController : ControllerBase
{
    private readonly ListerUtilisateursAvecFavoris _listerUtilisateursAvecFavoris;
    private readonly ChangerRole _changerRole;

    public UtilisateursController(ListerUtilisateursAvecFavoris listerUtilisateursAvecFavoris, ChangerRole changerRole)
    {
        _listerUtilisateursAvecFavoris = listerUtilisateursAvecFavoris;
        _changerRole = changerRole;
    }

    /// <summary>Liste tous les utilisateurs avec leurs restaurants favoris.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<UtilisateurAvecFavorisDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<UtilisateurAvecFavorisDto>>> Lister(CancellationToken ct)
    {
        var request = new ListerUtilisateursAvecFavorisRequest(User.ObtenirUtilisateurId(), User.ObtenirRole());
        var utilisateurs = await _listerUtilisateursAvecFavoris.ExecuterAsync(request, ct);

        return Ok(utilisateurs);
    }

    /// <summary>Change le rôle d'un utilisateur (promotion/rétrogradation), réservé aux Admins.</summary>
    [HttpPut("{id:guid}/role")]
    [Authorize(Policy = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ChangerRole(Guid id, ChangerRoleBody body, CancellationToken ct)
    {
        await _changerRole.ExecuterAsync(new ChangerRoleRequest(id, body.NouveauRole), ct);

        return NoContent();
    }
}

/// <summary>Corps de requête pour le changement de rôle d'un utilisateur (l'identifiant provient de l'URL).</summary>
public sealed record ChangerRoleBody(RoleUtilisateur NouveauRole);
