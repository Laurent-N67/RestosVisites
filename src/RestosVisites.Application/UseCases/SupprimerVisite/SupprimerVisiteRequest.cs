using RestosVisites.Domain.Enums;

namespace RestosVisites.Application.UseCases.SupprimerVisite;

public sealed record SupprimerVisiteRequest(Guid VisiteId, Guid UtilisateurCourantId, RoleUtilisateur RoleCourant);
