using RestosVisites.Application.Exceptions;
using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.ReinitialiserMotDePasse;
using RestosVisites.Domain.Entities;
using RestosVisites.Domain.Enums;

namespace RestosVisites.Application.Tests.UseCases;

public class ReinitialiserMotDePasseTests
{
    private const string MotDePasseValide = "NouveauMotDePasse123!";

    [Fact]
    public async Task ExecuterAsync_ValeursValides_ChangeLeMotDePasseDeLUtilisateur()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var hasher = new FakeMotDePasseHasher();
        var utilisateur = new Utilisateur(
            "personne@exemple.test", "Personne", "ancien-hash", "ancien-sel", 600_000, RoleUtilisateur.Simple);
        await utilisateurRepository.AjouterAsync(utilisateur, TestContext.Current.CancellationToken);
        var useCase = new ReinitialiserMotDePasse(utilisateurRepository, hasher);

        await useCase.ExecuterAsync(
            new ReinitialiserMotDePasseRequest(utilisateur.Id, MotDePasseValide), TestContext.Current.CancellationToken);

        Assert.NotEqual("ancien-hash", utilisateur.MotDePasseHash);
        Assert.True(hasher.Verifier(
            MotDePasseValide, utilisateur.MotDePasseHash, utilisateur.MotDePasseSel, utilisateur.MotDePasseIterations));
    }

    [Fact]
    public async Task ExecuterAsync_UtilisateurInexistant_LeveErreurApplicationExceptionRessourceNonTrouvee()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var useCase = new ReinitialiserMotDePasse(utilisateurRepository, new FakeMotDePasseHasher());

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(() => useCase.ExecuterAsync(
            new ReinitialiserMotDePasseRequest(Guid.NewGuid(), MotDePasseValide), TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RessourceNonTrouvee, exception.Type);
    }

    [Theory]
    [InlineData("Court1!")] // trop court
    [InlineData("motdepasseminuscule123!")] // pas de majuscule
    [InlineData("MotDePasseSansChiffre!")] // pas de chiffre
    [InlineData("MotDePasseSansSpecial123")] // pas de caractère spécial
    public async Task ExecuterAsync_MotDePasseNeRespectePasLaPolitique_LeveErreurApplicationExceptionRegleMetierViolee(string motDePasse)
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var utilisateur = new Utilisateur(
            "personne@exemple.test", "Personne", "ancien-hash", "ancien-sel", 600_000, RoleUtilisateur.Simple);
        await utilisateurRepository.AjouterAsync(utilisateur, TestContext.Current.CancellationToken);
        var useCase = new ReinitialiserMotDePasse(utilisateurRepository, new FakeMotDePasseHasher());

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(() => useCase.ExecuterAsync(
            new ReinitialiserMotDePasseRequest(utilisateur.Id, motDePasse), TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RegleMetierViolee, exception.Type);
        Assert.Equal("ancien-hash", utilisateur.MotDePasseHash);
    }
}
