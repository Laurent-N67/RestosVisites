using RestosVisites.Application.Exceptions;
using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.Inscrire;
using RestosVisites.Domain.Entities;
using RestosVisites.Domain.Enums;

namespace RestosVisites.Application.Tests.UseCases;

public class InscrireTests
{
    private const string MotDePasseValide = "MotDePasse123!";

    [Fact]
    public async Task ExecuterAsync_PremierInscrit_DevientAdmin()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var useCase = new Inscrire(utilisateurRepository, new FakeMotDePasseHasher());
        var request = new InscrireRequest("premier@exemple.test", "Premier Utilisateur", MotDePasseValide);

        var response = await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        Assert.Equal(RoleUtilisateur.Admin, response.Role);
        Assert.Single(utilisateurRepository.Utilisateurs);
    }

    [Fact]
    public async Task ExecuterAsync_PremierInscrit_IgnoreLUtilisateurHistorique_DevientQuandMemeAdmin()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var legacy = new Utilisateur(
            "legacy@restosvisites.local", "Utilisateur historique", "hash", "sel", 1, RoleUtilisateur.Simple);
        await utilisateurRepository.AjouterAsync(legacy, TestContext.Current.CancellationToken);
        utilisateurRepository.IdsUtilisateursHistoriques.Add(legacy.Id);

        var useCase = new Inscrire(utilisateurRepository, new FakeMotDePasseHasher());
        var request = new InscrireRequest("premier@exemple.test", "Premier Utilisateur", MotDePasseValide);

        var response = await useCase.ExecuterAsync(request, TestContext.Current.CancellationToken);

        Assert.Equal(RoleUtilisateur.Admin, response.Role);
    }

    [Fact]
    public async Task ExecuterAsync_DeuxiemeInscrit_EstSimple()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var hasher = new FakeMotDePasseHasher();
        var premierUseCase = new Inscrire(utilisateurRepository, hasher);
        await premierUseCase.ExecuterAsync(
            new InscrireRequest("premier@exemple.test", "Premier", MotDePasseValide), TestContext.Current.CancellationToken);

        var deuxiemeUseCase = new Inscrire(utilisateurRepository, hasher);
        var response = await deuxiemeUseCase.ExecuterAsync(
            new InscrireRequest("second@exemple.test", "Second", MotDePasseValide), TestContext.Current.CancellationToken);

        Assert.Equal(RoleUtilisateur.Simple, response.Role);
    }

    [Fact]
    public async Task ExecuterAsync_EmailDejaUtilise_LeveErreurApplicationExceptionConflitDeDonnees()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var hasher = new FakeMotDePasseHasher();
        var useCase = new Inscrire(utilisateurRepository, hasher);
        await useCase.ExecuterAsync(
            new InscrireRequest("doublon@exemple.test", "Premier", MotDePasseValide), TestContext.Current.CancellationToken);

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(() => useCase.ExecuterAsync(
            new InscrireRequest("doublon@exemple.test", "Second", MotDePasseValide), TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.ConflitDeDonnees, exception.Type);
    }

    [Theory]
    [InlineData("Court1!")] // trop court
    [InlineData("motdepasseminuscule123!")] // pas de majuscule
    [InlineData("MotDePasseSansChiffre!")] // pas de chiffre
    [InlineData("MotDePasseSansSpecial123")] // pas de caractère spécial
    public async Task ExecuterAsync_MotDePasseNeRespectePasLaPolitique_LeveErreurApplicationExceptionRegleMetierViolee(string motDePasse)
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var useCase = new Inscrire(utilisateurRepository, new FakeMotDePasseHasher());
        var request = new InscrireRequest("test@exemple.test", "Test", motDePasse);

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(
            () => useCase.ExecuterAsync(request, TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RegleMetierViolee, exception.Type);
        Assert.Empty(utilisateurRepository.Utilisateurs);
    }
}
