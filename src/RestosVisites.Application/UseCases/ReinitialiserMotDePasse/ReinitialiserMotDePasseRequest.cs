namespace RestosVisites.Application.UseCases.ReinitialiserMotDePasse;

public sealed record ReinitialiserMotDePasseRequest(Guid UtilisateurId, string NouveauMotDePasse);
