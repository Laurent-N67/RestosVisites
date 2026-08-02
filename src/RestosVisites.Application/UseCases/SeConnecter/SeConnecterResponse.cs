using RestosVisites.Domain.Enums;

namespace RestosVisites.Application.UseCases.SeConnecter;

public sealed record SeConnecterResponse(Guid Id, string Email, string NomAffiche, RoleUtilisateur Role);
