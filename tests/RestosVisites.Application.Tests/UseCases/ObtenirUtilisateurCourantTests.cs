using RestosVisites.Application.Exceptions;
using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.ObtenirUtilisateurCourant;
using RestosVisites.Domain.Entities;
using RestosVisites.Domain.Enums;

namespace RestosVisites.Application.Tests.UseCases;

public class ObtenirUtilisateurCourantTests
{
    [Fact]
    public async Task ExecuterAsync_UtilisateurExistant_RetourneSesInformations()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var utilisateur = new Utilisateur("personne@exemple.test", "Personne", "hash", "sel", 600_000, RoleUtilisateur.Simple);
        await utilisateurRepository.AjouterAsync(utilisateur, TestContext.Current.CancellationToken);
        var useCase = new ObtenirUtilisateurCourant(utilisateurRepository);

        var response = await useCase.ExecuterAsync(
            new ObtenirUtilisateurCourantRequest(utilisateur.Id), TestContext.Current.CancellationToken);

        Assert.Equal(utilisateur.Id, response.Id);
        Assert.Equal(utilisateur.Email, response.Email);
        Assert.Equal(utilisateur.NomAffiche, response.NomAffiche);
        Assert.Equal(utilisateur.Role, response.Role);
    }

    [Fact]
    public async Task ExecuterAsync_UtilisateurInexistant_LeveErreurApplicationExceptionRessourceNonTrouvee()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var useCase = new ObtenirUtilisateurCourant(utilisateurRepository);

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(() => useCase.ExecuterAsync(
            new ObtenirUtilisateurCourantRequest(Guid.NewGuid()), TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RessourceNonTrouvee, exception.Type);
    }
}
