namespace RestosVisites.Application.UseCases.ChangerNomAffiche;

public sealed record ChangerNomAfficheRequest(Guid UtilisateurId, string NouveauNomAffiche);
