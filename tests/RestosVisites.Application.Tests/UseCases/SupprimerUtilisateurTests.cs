using RestosVisites.Application.Exceptions;
using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.SupprimerUtilisateur;
using RestosVisites.Domain.Entities;
using RestosVisites.Domain.Enums;
using RestosVisites.Domain.ValueObjects;

namespace RestosVisites.Application.Tests.UseCases;

public class SupprimerUtilisateurTests
{
    [Fact]
    public async Task ExecuterAsync_UtilisateurExistant_SupprimeLUtilisateurEtSesVisites()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var visiteRepository = new FakeVisiteRepository();
        var admin = new Utilisateur("admin@exemple.test", "Admin", "hash", "sel", 600_000, RoleUtilisateur.Admin);
        var simple = new Utilisateur("simple@exemple.test", "Simple", "hash", "sel", 600_000, RoleUtilisateur.Simple);
        await utilisateurRepository.AjouterAsync(admin, TestContext.Current.CancellationToken);
        await utilisateurRepository.AjouterAsync(simple, TestContext.Current.CancellationToken);
        var visiteAutrui = new Visite(Guid.NewGuid(), admin.Id, new DateOnly(2026, 1, 1), new Note(4));
        var visiteDeSimple = new Visite(Guid.NewGuid(), simple.Id, new DateOnly(2026, 1, 2), new Note(5));
        await visiteRepository.AjouterAsync(visiteAutrui, TestContext.Current.CancellationToken);
        await visiteRepository.AjouterAsync(visiteDeSimple, TestContext.Current.CancellationToken);
        var useCase = new SupprimerUtilisateur(utilisateurRepository, visiteRepository);

        await useCase.ExecuterAsync(new SupprimerUtilisateurRequest(simple.Id), TestContext.Current.CancellationToken);

        Assert.DoesNotContain(utilisateurRepository.Utilisateurs, u => u.Id == simple.Id);
        Assert.DoesNotContain(visiteRepository.Visites, v => v.UtilisateurId == simple.Id);
        Assert.Contains(visiteRepository.Visites, v => v.Id == visiteAutrui.Id);
    }

    [Fact]
    public async Task ExecuterAsync_UtilisateurInexistant_LeveErreurApplicationExceptionRessourceNonTrouvee()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var visiteRepository = new FakeVisiteRepository();
        var useCase = new SupprimerUtilisateur(utilisateurRepository, visiteRepository);

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(() => useCase.ExecuterAsync(
            new SupprimerUtilisateurRequest(Guid.NewGuid()), TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RessourceNonTrouvee, exception.Type);
    }

    [Fact]
    public async Task ExecuterAsync_UtilisateurHistorique_LeveErreurApplicationExceptionRegleMetierViolee()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var visiteRepository = new FakeVisiteRepository();
        var utilisateurHistorique = new Utilisateur("historique@exemple.test", "Historique", "hash", "sel", 600_000, RoleUtilisateur.Simple);
        await utilisateurRepository.AjouterAsync(utilisateurHistorique, TestContext.Current.CancellationToken);
        utilisateurRepository.IdsUtilisateursHistoriques.Add(utilisateurHistorique.Id);
        var useCase = new SupprimerUtilisateur(utilisateurRepository, visiteRepository);

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(() => useCase.ExecuterAsync(
            new SupprimerUtilisateurRequest(utilisateurHistorique.Id), TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RegleMetierViolee, exception.Type);
        Assert.Contains(utilisateurRepository.Utilisateurs, u => u.Id == utilisateurHistorique.Id);
    }

    [Fact]
    public async Task ExecuterAsync_DernierAdmin_LeveErreurApplicationExceptionRegleMetierViolee()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var visiteRepository = new FakeVisiteRepository();
        var seulAdmin = new Utilisateur("admin@exemple.test", "Admin", "hash", "sel", 600_000, RoleUtilisateur.Admin);
        await utilisateurRepository.AjouterAsync(seulAdmin, TestContext.Current.CancellationToken);
        var useCase = new SupprimerUtilisateur(utilisateurRepository, visiteRepository);

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(() => useCase.ExecuterAsync(
            new SupprimerUtilisateurRequest(seulAdmin.Id), TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RegleMetierViolee, exception.Type);
        Assert.Contains(utilisateurRepository.Utilisateurs, u => u.Id == seulAdmin.Id);
    }

    [Fact]
    public async Task ExecuterAsync_AdminQuandIlEnResteUnAutre_Reussit()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var visiteRepository = new FakeVisiteRepository();
        var premierAdmin = new Utilisateur("admin1@exemple.test", "Admin 1", "hash", "sel", 600_000, RoleUtilisateur.Admin);
        var secondAdmin = new Utilisateur("admin2@exemple.test", "Admin 2", "hash", "sel", 600_000, RoleUtilisateur.Admin);
        await utilisateurRepository.AjouterAsync(premierAdmin, TestContext.Current.CancellationToken);
        await utilisateurRepository.AjouterAsync(secondAdmin, TestContext.Current.CancellationToken);
        var useCase = new SupprimerUtilisateur(utilisateurRepository, visiteRepository);

        await useCase.ExecuterAsync(new SupprimerUtilisateurRequest(secondAdmin.Id), TestContext.Current.CancellationToken);

        Assert.DoesNotContain(utilisateurRepository.Utilisateurs, u => u.Id == secondAdmin.Id);
        Assert.Contains(utilisateurRepository.Utilisateurs, u => u.Id == premierAdmin.Id);
    }
}
