using RestosVisites.Application.Exceptions;
using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.SupprimerVisite;
using RestosVisites.Domain.Entities;
using RestosVisites.Domain.ValueObjects;

namespace RestosVisites.Application.Tests.UseCases;

public class SupprimerVisiteTests
{
    [Fact]
    public async Task ExecuterAsync_CasNominal_SupprimeLaVisite()
    {
        var visiteRepository = new FakeVisiteRepository();
        var visite = new Visite(Guid.NewGuid(), new DateOnly(2026, 1, 15), new Note(4));
        await visiteRepository.AjouterAsync(visite, TestContext.Current.CancellationToken);
        var useCase = new SupprimerVisite(visiteRepository);
        var request = new SupprimerVisiteRequest(visite.Id);

        await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        Assert.Empty(visiteRepository.Visites);
    }

    [Fact]
    public async Task ExecuterAsync_VisiteInexistante_LeveErreurApplicationExceptionRessourceNonTrouvee()
    {
        var visiteRepository = new FakeVisiteRepository();
        var useCase = new SupprimerVisite(visiteRepository);
        var request = new SupprimerVisiteRequest(Guid.NewGuid());

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(
            () => useCase.ExecuterAsync(request, TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RessourceNonTrouvee, exception.Type);
    }
}
