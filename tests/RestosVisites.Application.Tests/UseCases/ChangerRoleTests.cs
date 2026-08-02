using RestosVisites.Application.Exceptions;
using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.ChangerRole;
using RestosVisites.Domain.Entities;
using RestosVisites.Domain.Enums;

namespace RestosVisites.Application.Tests.UseCases;

public class ChangerRoleTests
{
    [Fact]
    public async Task ExecuterAsync_PromouvoirUnUtilisateurSimple_LeRendAdmin()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var admin = new Utilisateur("admin@exemple.test", "Admin", "hash", "sel", 600_000, RoleUtilisateur.Admin);
        var simple = new Utilisateur("simple@exemple.test", "Simple", "hash", "sel", 600_000, RoleUtilisateur.Simple);
        await utilisateurRepository.AjouterAsync(admin, TestContext.Current.CancellationToken);
        await utilisateurRepository.AjouterAsync(simple, TestContext.Current.CancellationToken);
        var useCase = new ChangerRole(utilisateurRepository);

        await useCase.ExecuterAsync(
            new ChangerRoleRequest(simple.Id, RoleUtilisateur.Admin), TestContext.Current.CancellationToken);

        Assert.Equal(RoleUtilisateur.Admin, simple.Role);
    }

    [Fact]
    public async Task ExecuterAsync_RetrogaderUnAdminQuandIlEnResteUnAutre_Reussit()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var premierAdmin = new Utilisateur("admin1@exemple.test", "Admin 1", "hash", "sel", 600_000, RoleUtilisateur.Admin);
        var secondAdmin = new Utilisateur("admin2@exemple.test", "Admin 2", "hash", "sel", 600_000, RoleUtilisateur.Admin);
        await utilisateurRepository.AjouterAsync(premierAdmin, TestContext.Current.CancellationToken);
        await utilisateurRepository.AjouterAsync(secondAdmin, TestContext.Current.CancellationToken);
        var useCase = new ChangerRole(utilisateurRepository);

        await useCase.ExecuterAsync(
            new ChangerRoleRequest(secondAdmin.Id, RoleUtilisateur.Simple), TestContext.Current.CancellationToken);

        Assert.Equal(RoleUtilisateur.Simple, secondAdmin.Role);
    }

    [Fact]
    public async Task ExecuterAsync_RetrograderLeDernierAdmin_LeveErreurApplicationExceptionRegleMetierViolee()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var seulAdmin = new Utilisateur("admin@exemple.test", "Admin", "hash", "sel", 600_000, RoleUtilisateur.Admin);
        await utilisateurRepository.AjouterAsync(seulAdmin, TestContext.Current.CancellationToken);
        var useCase = new ChangerRole(utilisateurRepository);

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(() => useCase.ExecuterAsync(
            new ChangerRoleRequest(seulAdmin.Id, RoleUtilisateur.Simple), TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RegleMetierViolee, exception.Type);
        Assert.Equal(RoleUtilisateur.Admin, seulAdmin.Role);
    }

    [Fact]
    public async Task ExecuterAsync_UtilisateurInexistant_LeveErreurApplicationExceptionRessourceNonTrouvee()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var useCase = new ChangerRole(utilisateurRepository);

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(() => useCase.ExecuterAsync(
            new ChangerRoleRequest(Guid.NewGuid(), RoleUtilisateur.Admin), TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RessourceNonTrouvee, exception.Type);
    }
}
