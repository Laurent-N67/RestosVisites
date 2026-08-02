using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using RestosVisites.Application.Exceptions;

namespace RestosVisites.Api.Middleware;

/// <summary>
/// Traduit les <see cref="ErreurApplicationException"/> levées par les cas d'usage en réponses
/// HTTP appropriées (404 pour une ressource non trouvée, 409 pour un conflit de données), afin
/// d'éviter de dupliquer des blocs try/catch dans chaque contrôleur.
/// </summary>
public sealed class ErreurApplicationExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        if (exception is ErreurApplicationException erreurApplicationException)
        {
            var statusCode = erreurApplicationException.Type switch
            {
                TypeErreurApplication.RessourceNonTrouvee => StatusCodes.Status404NotFound,
                TypeErreurApplication.ConflitDeDonnees => StatusCodes.Status409Conflict,
                TypeErreurApplication.NonAutorise => StatusCodes.Status401Unauthorized,
                TypeErreurApplication.AccesRefuse => StatusCodes.Status403Forbidden,
                TypeErreurApplication.RegleMetierViolee => StatusCodes.Status422UnprocessableEntity,
                _ => StatusCodes.Status400BadRequest,
            };

            var problemDetails = new ProblemDetails
            {
                Status = statusCode,
                Title = erreurApplicationException.Type.ToString(),
                Detail = erreurApplicationException.Message,
            };

            httpContext.Response.StatusCode = statusCode;
            await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

            return true;
        }

        if (exception is ArgumentException argumentException)
        {
            // Les entités du Domain (Utilisateur, Visite, FavoriRestaurant, Restaurant, Categorie,
            // Note, Photo, ...) lèvent des ArgumentException/ArgumentOutOfRangeException depuis leurs
            // constructeurs et méthodes de validation en cas d'entrée invalide (email vide, note hors
            // plage, etc.). On les traduit en 422 au même titre que RegleMetierViolee ci-dessus.
            const int statusCode = StatusCodes.Status422UnprocessableEntity;

            var problemDetails = new ProblemDetails
            {
                Status = statusCode,
                Title = TypeErreurApplication.RegleMetierViolee.ToString(),
                Detail = argumentException.Message,
            };

            httpContext.Response.StatusCode = statusCode;
            await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

            return true;
        }

        return false;
    }
}
