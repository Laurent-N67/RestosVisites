namespace RestosVisites.Application.Exceptions;

/// <summary>
/// Exception représentant une erreur métier attendue (par opposition à une exception technique
/// imprévue) : restaurant introuvable, doublon à la création, etc. Utilisée de façon cohérente
/// par tous les cas d'usage d'Application afin que les couches appelantes (Api) puissent la
/// distinguer facilement des erreurs techniques et la traduire en réponse HTTP appropriée.
/// </summary>
public sealed class ErreurApplicationException : Exception
{
    public TypeErreurApplication Type { get; }

    public ErreurApplicationException(TypeErreurApplication type, string message)
        : base(message)
    {
        Type = type;
    }
}
