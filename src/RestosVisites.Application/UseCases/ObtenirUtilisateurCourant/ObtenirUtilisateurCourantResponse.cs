using RestosVisites.Domain.Enums;

namespace RestosVisites.Application.UseCases.ObtenirUtilisateurCourant;

public sealed record ObtenirUtilisateurCourantResponse(Guid Id, string Email, string NomAffiche, RoleUtilisateur Role);
