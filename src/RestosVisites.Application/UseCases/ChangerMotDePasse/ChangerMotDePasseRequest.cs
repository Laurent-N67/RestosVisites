namespace RestosVisites.Application.UseCases.ChangerMotDePasse;

public sealed record ChangerMotDePasseRequest(Guid UtilisateurId, string MotDePasseActuel, string NouveauMotDePasse);
