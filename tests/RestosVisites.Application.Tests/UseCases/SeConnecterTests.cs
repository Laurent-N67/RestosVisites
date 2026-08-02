using RestosVisites.Application.Exceptions;
using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.Inscrire;
using RestosVisites.Application.UseCases.SeConnecter;

namespace RestosVisites.Application.Tests.UseCases;

public class SeConnecterTests
{
    private const string MotDePasseValide = "MotDePasse123!";

    private static async Task<FakeUtilisateurRepository> CreerUtilisateurExistantAsync()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var inscrire = new Inscrire(utilisateurRepository, new FakeMotDePasseHasher());
        await inscrire.ExecuterAsync(
            new InscrireRequest("personne@exemple.test", "Personne", MotDePasseValide), TestContext.Current.CancellationToken);
        return utilisateurRepository;
    }

    [Fact]
    public async Task ExecuterAsync_IdentifiantsValides_RetourneLUtilisateur()
    {
        var utilisateurRepository = await CreerUtilisateurExistantAsync();
        var useCase = new SeConnecter(utilisateurRepository, new FakeMotDePasseHasher());

        var response = await useCase.ExecuterAsync(
            new SeConnecterRequest("personne@exemple.test", MotDePasseValide), TestContext.Current.CancellationToken);

        Assert.Equal("personne@exemple.test", response.Email);
    }

    [Fact]
    public async Task ExecuterAsync_EmailInconnu_LeveErreurApplicationExceptionNonAutorise()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var useCase = new SeConnecter(utilisateurRepository, new FakeMotDePasseHasher());

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(() => useCase.ExecuterAsync(
            new SeConnecterRequest("inconnu@exemple.test", MotDePasseValide), TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.NonAutorise, exception.Type);
    }

    [Fact]
    public async Task ExecuterAsync_MotDePasseIncorrect_LeveErreurApplicationExceptionNonAutorise()
    {
        var utilisateurRepository = await CreerUtilisateurExistantAsync();
        var useCase = new SeConnecter(utilisateurRepository, new FakeMotDePasseHasher());

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(() => useCase.ExecuterAsync(
            new SeConnecterRequest("personne@exemple.test", "MauvaisMotDePasse123!"), TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.NonAutorise, exception.Type);
    }

    [Fact]
    public async Task ExecuterAsync_EmailInconnuEtMotDePasseIncorrect_MemeMessageDErreur()
    {
        var utilisateurRepository = await CreerUtilisateurExistantAsync();
        var useCase = new SeConnecter(utilisateurRepository, new FakeMotDePasseHasher());

        var exceptionEmailInconnu = await Assert.ThrowsAsync<ErreurApplicationException>(() => useCase.ExecuterAsync(
            new SeConnecterRequest("inconnu@exemple.test", MotDePasseValide), TestContext.Current.CancellationToken));
        var exceptionMotDePasseIncorrect = await Assert.ThrowsAsync<ErreurApplicationException>(() => useCase.ExecuterAsync(
            new SeConnecterRequest("personne@exemple.test", "MauvaisMotDePasse123!"), TestContext.Current.CancellationToken));

        Assert.Equal(exceptionEmailInconnu.Message, exceptionMotDePasseIncorrect.Message);
    }
}
