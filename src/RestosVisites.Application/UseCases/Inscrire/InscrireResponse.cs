using RestosVisites.Domain.Enums;

namespace RestosVisites.Application.UseCases.Inscrire;

public sealed record InscrireResponse(Guid Id, string Email, string NomAffiche, RoleUtilisateur Role);
