using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestosVisites.Application.UseCases.ChangerMotDePasse;
using RestosVisites.Application.UseCases.ChangerNomAffiche;
using RestosVisites.Application.UseCases.Inscrire;
using RestosVisites.Application.UseCases.ObtenirUtilisateurCourant;
using RestosVisites.Application.UseCases.SeConnecter;
using RestosVisites.Application.UseCases.SupprimerUtilisateur;
using RestosVisites.Domain.Enums;

namespace RestosVisites.Api.Controllers;

/// <summary>
/// Inscription, connexion, déconnexion et informations de l'utilisateur courant. Utilise
/// l'authentification par cookie (<see cref="CookieAuthenticationDefaults.AuthenticationScheme"/>,
/// configurée dans Program.cs) : aucun jeton n'est jamais renvoyé au client, la session est portée
/// entièrement par le cookie HttpOnly.
/// </summary>
[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly Inscrire _inscrire;
    private readonly SeConnecter _seConnecter;
    private readonly ObtenirUtilisateurCourant _obtenirUtilisateurCourant;
    private readonly ChangerNomAffiche _changerNomAffiche;
    private readonly ChangerMotDePasse _changerMotDePasse;
    private readonly SupprimerUtilisateur _supprimerUtilisateur;

    public AuthController(
        Inscrire inscrire,
        SeConnecter seConnecter,
        ObtenirUtilisateurCourant obtenirUtilisateurCourant,
        ChangerNomAffiche changerNomAffiche,
        ChangerMotDePasse changerMotDePasse,
        SupprimerUtilisateur supprimerUtilisateur)
    {
        _inscrire = inscrire;
        _seConnecter = seConnecter;
        _obtenirUtilisateurCourant = obtenirUtilisateurCourant;
        _changerNomAffiche = changerNomAffiche;
        _changerMotDePasse = changerMotDePasse;
        _supprimerUtilisateur = supprimerUtilisateur;
    }

    /// <summary>Inscrit un nouvel utilisateur et le connecte immédiatement (pose le cookie de session).</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(InscrireResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<InscrireResponse>> Inscrire(InscrireRequest request, CancellationToken ct)
    {
        var response = await _inscrire.ExecuterAsync(request, ct);
        await ConnecterAsync(response.Id, response.Email, response.NomAffiche, response.Role);

        return Created("/api/auth/me", response);
    }

    /// <summary>Authentifie un utilisateur existant et pose le cookie de session.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(SeConnecterResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<SeConnecterResponse>> SeConnecter(SeConnecterRequest request, CancellationToken ct)
    {
        var response = await _seConnecter.ExecuterAsync(request, ct);
        await ConnecterAsync(response.Id, response.Email, response.NomAffiche, response.Role);

        return Ok(response);
    }

    /// <summary>Termine la session en cours (efface le cookie).</summary>
    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Deconnecter()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

        return NoContent();
    }

    /// <summary>Informations de l'utilisateur actuellement authentifié.</summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(ObtenirUtilisateurCourantResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ObtenirUtilisateurCourantResponse>> ObtenirUtilisateurCourant(CancellationToken ct)
    {
        var request = new ObtenirUtilisateurCourantRequest(User.ObtenirUtilisateurId());
        var response = await _obtenirUtilisateurCourant.ExecuterAsync(request, ct);

        return Ok(response);
    }

    /// <summary>Change le nom affiché de l'utilisateur courant (libre-service, tout rôle confondu).</summary>
    [HttpPut("me")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ChangerNomAffiche(ChangerNomAfficheBody body, CancellationToken ct)
    {
        await _changerNomAffiche.ExecuterAsync(
            new ChangerNomAfficheRequest(User.ObtenirUtilisateurId(), body.NouveauNomAffiche), ct);

        return NoContent();
    }

    /// <summary>
    /// Change le mot de passe de l'utilisateur courant (libre-service, tout rôle confondu),
    /// en confirmant son mot de passe actuel.
    /// </summary>
    [HttpPut("me/mot-de-passe")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ChangerMotDePasse(ChangerMotDePasseBody body, CancellationToken ct)
    {
        await _changerMotDePasse.ExecuterAsync(
            new ChangerMotDePasseRequest(User.ObtenirUtilisateurId(), body.MotDePasseActuel, body.NouveauMotDePasse), ct);

        return NoContent();
    }

    /// <summary>
    /// Supprime le compte de l'utilisateur courant (libre-service, tout rôle confondu) et termine sa
    /// session.
    /// </summary>
    [HttpDelete("me")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> SupprimerCompte(CancellationToken ct)
    {
        await _supprimerUtilisateur.ExecuterAsync(
            new SupprimerUtilisateurRequest(User.ObtenirUtilisateurId()), ct);

        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

        return NoContent();
    }

    /// <summary>
    /// Pose le cookie de session avec les claims nécessaires aux contrôleurs (identifiant + rôle),
    /// jamais renseignés depuis une valeur fournie par le client.
    /// </summary>
    private async Task ConnecterAsync(Guid id, string email, string nomAffiche, RoleUtilisateur role)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, id.ToString()),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Name, nomAffiche),
            new(ClaimTypes.Role, role.ToString()),
        };
        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        // IsPersistent = true : le cookie survit à la fermeture du navigateur (au lieu d'un cookie
        // de session), pour la durée de session longue configurée dans Program.cs (30 jours glissants).
        var proprietes = new AuthenticationProperties { IsPersistent = true };
        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal, proprietes);
    }
}

/// <summary>Corps de requête pour le changement du nom affiché de l'utilisateur courant.</summary>
public sealed record ChangerNomAfficheBody(string NouveauNomAffiche);

/// <summary>Corps de requête pour le changement du mot de passe de l'utilisateur courant.</summary>
public sealed record ChangerMotDePasseBody(string MotDePasseActuel, string NouveauMotDePasse);
