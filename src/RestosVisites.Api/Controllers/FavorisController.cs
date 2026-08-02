using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestosVisites.Application.UseCases.AjouterFavori;
using RestosVisites.Application.UseCases.ListerMesFavoris;
using RestosVisites.Application.UseCases.RetirerFavori;

namespace RestosVisites.Api.Controllers;

/// <summary>
/// Restaurants favoris de l'utilisateur courant. L'identifiant utilisateur provient toujours des
/// claims du cookie de session, jamais du corps ou de la route, afin qu'un utilisateur ne puisse
/// jamais manipuler les favoris de quelqu'un d'autre.
/// </summary>
[ApiController]
[Route("api/favoris")]
[Authorize]
public sealed class FavorisController : ControllerBase
{
    private readonly ListerMesFavoris _listerMesFavoris;
    private readonly AjouterFavori _ajouterFavori;
    private readonly RetirerFavori _retirerFavori;

    public FavorisController(ListerMesFavoris listerMesFavoris, AjouterFavori ajouterFavori, RetirerFavori retirerFavori)
    {
        _listerMesFavoris = listerMesFavoris;
        _ajouterFavori = ajouterFavori;
        _retirerFavori = retirerFavori;
    }

    /// <summary>Liste les restaurants favoris de l'utilisateur courant.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<MonFavoriDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<MonFavoriDto>>> Lister(CancellationToken ct)
    {
        var favoris = await _listerMesFavoris.ExecuterAsync(new ListerMesFavorisRequest(User.ObtenirUtilisateurId()), ct);

        return Ok(favoris);
    }

    /// <summary>Ajoute un restaurant aux favoris de l'utilisateur courant (idempotent, max 6).</summary>
    [HttpPut("{restaurantId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Ajouter(Guid restaurantId, CancellationToken ct)
    {
        await _ajouterFavori.ExecuterAsync(new AjouterFavoriRequest(User.ObtenirUtilisateurId(), restaurantId), ct);

        return NoContent();
    }

    /// <summary>Retire un restaurant des favoris de l'utilisateur courant (idempotent).</summary>
    [HttpDelete("{restaurantId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Retirer(Guid restaurantId, CancellationToken ct)
    {
        await _retirerFavori.ExecuterAsync(new RetirerFavoriRequest(User.ObtenirUtilisateurId(), restaurantId), ct);

        return NoContent();
    }
}
