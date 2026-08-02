using RestosVisites.Domain.Enums;

namespace RestosVisites.Application.UseCases.ListerUtilisateursAvecFavoris;

public sealed record ListerUtilisateursAvecFavorisRequest(Guid UtilisateurCourantId, RoleUtilisateur RoleCourant);
