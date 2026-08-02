using RestosVisites.Application.Exceptions;
using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.SupprimerVisite;
using RestosVisites.Domain.Entities;
using RestosVisites.Domain.Enums;
using RestosVisites.Domain.ValueObjects;

namespace RestosVisites.Application.Tests.UseCases;

public class SupprimerVisiteTests
{
    private static readonly Guid AuteurId = Guid.NewGuid();

    [Fact]
    public async Task ExecuterAsync_AuteurSupprimeSaPropreVisite_LaSupprime()
    {
        var visiteRepository = new FakeVisiteRepository();
        var visite = new Visite(Guid.NewGuid(), AuteurId, new DateOnly(2026, 1, 15), new Note(4));
        await visiteRepository.AjouterAsync(visite, TestContext.Current.CancellationToken);
        var useCase = new SupprimerVisite(visiteRepository);
        var request = new SupprimerVisiteRequest(visite.Id, AuteurId, RoleUtilisateur.Simple);

        await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        Assert.Empty(visiteRepository.Visites);
    }

    [Fact]
    public async Task ExecuterAsync_VisiteInexistante_LeveErreurApplicationExceptionRessourceNonTrouvee()
    {
        var visiteRepository = new FakeVisiteRepository();
        var useCase = new SupprimerVisite(visiteRepository);
        var request = new SupprimerVisiteRequest(Guid.NewGuid(), AuteurId, RoleUtilisateur.Simple);

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(
            () => useCase.ExecuterAsync(request, TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RessourceNonTrouvee, exception.Type);
    }

    [Fact]
    public async Task ExecuterAsync_UtilisateurNiAuteurNiAdmin_LeveErreurApplicationExceptionAccesRefuse()
    {
        var visiteRepository = new FakeVisiteRepository();
        var visite = new Visite(Guid.NewGuid(), AuteurId, new DateOnly(2026, 1, 15), new Note(4));
        await visiteRepository.AjouterAsync(visite, TestContext.Current.CancellationToken);
        var useCase = new SupprimerVisite(visiteRepository);
        var request = new SupprimerVisiteRequest(visite.Id, Guid.NewGuid(), RoleUtilisateur.Simple);

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(
            () => useCase.ExecuterAsync(request, TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.AccesRefuse, exception.Type);
        Assert.Single(visiteRepository.Visites);
    }

    [Fact]
    public async Task ExecuterAsync_AdminSupprimeLaVisiteDeQuelquUnDautre_Reussit()
    {
        var visiteRepository = new FakeVisiteRepository();
        var visite = new Visite(Guid.NewGuid(), AuteurId, new DateOnly(2026, 1, 15), new Note(4));
        await visiteRepository.AjouterAsync(visite, TestContext.Current.CancellationToken);
        var useCase = new SupprimerVisite(visiteRepository);
        var request = new SupprimerVisiteRequest(visite.Id, Guid.NewGuid(), RoleUtilisateur.Admin);

        await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        Assert.Empty(visiteRepository.Visites);
    }
}
