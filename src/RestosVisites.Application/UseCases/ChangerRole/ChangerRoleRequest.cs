using RestosVisites.Domain.Enums;

namespace RestosVisites.Application.UseCases.ChangerRole;

public sealed record ChangerRoleRequest(Guid UtilisateurId, RoleUtilisateur NouveauRole);
