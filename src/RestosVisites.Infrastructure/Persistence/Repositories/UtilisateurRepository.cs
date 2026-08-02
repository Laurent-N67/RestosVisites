using Microsoft.EntityFrameworkCore;
using RestosVisites.Application.Abstractions;
using RestosVisites.Domain.Entities;
using RestosVisites.Domain.Enums;
using RestosVisites.Infrastructure.Persistence.Seed;

namespace RestosVisites.Infrastructure.Persistence.Repositories;

public sealed class UtilisateurRepository : IUtilisateurRepository
{
    private readonly RestosVisitesDbContext _dbContext;

    public UtilisateurRepository(RestosVisitesDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AjouterAsync(Utilisateur utilisateur, CancellationToken ct)
    {
        await _dbContext.Utilisateurs.AddAsync(utilisateur, ct);
        await _dbContext.SaveChangesAsync(ct);
    }

    public async Task<Utilisateur?> ObtenirParIdAsync(Guid id, CancellationToken ct)
        => await _dbContext.Utilisateurs.FirstOrDefaultAsync(u => u.Id == id, ct);

    public async Task<Utilisateur?> ObtenirParEmailAsync(string email, CancellationToken ct)
    {
        // L'email est déjà normalisé (trim + minuscules) côté Domain à la construction : on
        // applique la même normalisation ici pour que la recherche fonctionne quelle que soit la
        // casse saisie par l'utilisateur à la connexion.
        var emailNormalise = email.Trim().ToLower();
        return await _dbContext.Utilisateurs.FirstOrDefaultAsync(u => u.Email == emailNormalise, ct);
    }

    public async Task<IReadOnlyList<Utilisateur>> ListerAsync(CancellationToken ct)
        => await _dbContext.Utilisateurs.AsNoTracking().ToListAsync(ct);

    public async Task<IReadOnlyList<Utilisateur>> ListerUtilisateursReelsAsync(CancellationToken ct)
        => await _dbContext.Utilisateurs
            .AsNoTracking()
            .Where(u => u.Id != LegacyUtilisateurSeed.Id)
            .ToListAsync(ct);

    public async Task<bool> ExisteAuMoinsUnUtilisateurReelAsync(CancellationToken ct)
        => await _dbContext.Utilisateurs.AnyAsync(u => u.Id != LegacyUtilisateurSeed.Id, ct);

    public async Task<int> CompterAdminsAsync(CancellationToken ct)
        => await _dbContext.Utilisateurs.CountAsync(u => u.Role == RoleUtilisateur.Admin, ct);

    public async Task MettreAJourAsync(Utilisateur utilisateur, CancellationToken ct)
    {
        _dbContext.Utilisateurs.Update(utilisateur);
        await _dbContext.SaveChangesAsync(ct);
    }
}
