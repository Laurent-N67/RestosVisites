using RestosVisites.Application.Exceptions;
using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.ChangerNomAffiche;
using RestosVisites.Domain.Entities;
using RestosVisites.Domain.Enums;

namespace RestosVisites.Application.Tests.UseCases;

public class ChangerNomAfficheTests
{
    [Fact]
    public async Task ExecuterAsync_NouveauNomValide_ChangeLeNomAfficheDeLUtilisateur()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var utilisateur = new Utilisateur(
            "personne@exemple.test", "Ancien Nom", "hash", "sel", 600_000, RoleUtilisateur.Simple);
        await utilisateurRepository.AjouterAsync(utilisateur, TestContext.Current.CancellationToken);
        var useCase = new ChangerNomAffiche(utilisateurRepository);

        await useCase.ExecuterAsync(
            new ChangerNomAfficheRequest(utilisateur.Id, "Nouveau Nom"), TestContext.Current.CancellationToken);

        Assert.Equal("Nouveau Nom", utilisateur.NomAffiche);
    }

    [Fact]
    public async Task ExecuterAsync_UtilisateurInexistant_LeveErreurApplicationExceptionRessourceNonTrouvee()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var useCase = new ChangerNomAffiche(utilisateurRepository);

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(() => useCase.ExecuterAsync(
            new ChangerNomAfficheRequest(Guid.NewGuid(), "Nouveau Nom"), TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RessourceNonTrouvee, exception.Type);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public async Task ExecuterAsync_NouveauNomVideOuBlanc_LeveArgumentException(string nouveauNomAffiche)
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var utilisateur = new Utilisateur(
            "personne@exemple.test", "Ancien Nom", "hash", "sel", 600_000, RoleUtilisateur.Simple);
        await utilisateurRepository.AjouterAsync(utilisateur, TestContext.Current.CancellationToken);
        var useCase = new ChangerNomAffiche(utilisateurRepository);

        await Assert.ThrowsAsync<ArgumentException>(() => useCase.ExecuterAsync(
            new ChangerNomAfficheRequest(utilisateur.Id, nouveauNomAffiche), TestContext.Current.CancellationToken));
        Assert.Equal("Ancien Nom", utilisateur.NomAffiche);
    }
}
