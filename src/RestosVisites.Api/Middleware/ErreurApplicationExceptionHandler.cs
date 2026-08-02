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
        if (exception is not ErreurApplicationException erreurApplicationException)
        {
            return false;
        }

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
}
