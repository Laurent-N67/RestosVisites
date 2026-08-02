using RestosVisites.Application.Exceptions;
using RestosVisites.Application.Tests.Fakes;
using RestosVisites.Application.UseCases.ChangerMotDePasse;
using RestosVisites.Domain.Entities;
using RestosVisites.Domain.Enums;

namespace RestosVisites.Application.Tests.UseCases;

public class ChangerMotDePasseTests
{
    private const string MotDePasseActuel = "MotDePasseActuel123!";
    private const string NouveauMotDePasseValide = "NouveauMotDePasse123!";

    private static async Task<(FakeUtilisateurRepository Repository, Utilisateur Utilisateur, FakeMotDePasseHasher Hasher)>
        CreerUtilisateurExistantAsync()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var hasher = new FakeMotDePasseHasher();
        var resultatHachage = hasher.Hacher(MotDePasseActuel);
        var utilisateur = new Utilisateur(
            "personne@exemple.test", "Personne", resultatHachage.Hash, resultatHachage.Sel, resultatHachage.Iterations,
            RoleUtilisateur.Simple);
        await utilisateurRepository.AjouterAsync(utilisateur, TestContext.Current.CancellationToken);
        return (utilisateurRepository, utilisateur, hasher);
    }

    [Fact]
    public async Task ExecuterAsync_MotDePasseActuelCorrectEtNouveauValide_ChangeLeMotDePasseDeLUtilisateur()
    {
        var (utilisateurRepository, utilisateur, hasher) = await CreerUtilisateurExistantAsync();
        var utilisateurRepositoryAncienHash = utilisateur.MotDePasseHash;
        var useCase = new ChangerMotDePasse(utilisateurRepository, hasher);

        await useCase.ExecuterAsync(
            new ChangerMotDePasseRequest(utilisateur.Id, MotDePasseActuel, NouveauMotDePasseValide),
            TestContext.Current.CancellationToken);

        Assert.NotEqual(utilisateurRepositoryAncienHash, utilisateur.MotDePasseHash);
        Assert.True(hasher.Verifier(
            NouveauMotDePasseValide, utilisateur.MotDePasseHash, utilisateur.MotDePasseSel, utilisateur.MotDePasseIterations));
    }

    [Fact]
    public async Task ExecuterAsync_MotDePasseActuelIncorrect_LeveErreurApplicationExceptionNonAutorise()
    {
        var (utilisateurRepository, utilisateur, hasher) = await CreerUtilisateurExistantAsync();
        var ancienHash = utilisateur.MotDePasseHash;
        var useCase = new ChangerMotDePasse(utilisateurRepository, hasher);

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(() => useCase.ExecuterAsync(
            new ChangerMotDePasseRequest(utilisateur.Id, "MauvaisMotDePasse123!", NouveauMotDePasseValide),
            TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.NonAutorise, exception.Type);
        Assert.Equal(ancienHash, utilisateur.MotDePasseHash);
    }

    [Theory]
    [InlineData("Court1!")] // trop court
    [InlineData("motdepasseminuscule123!")] // pas de majuscule
    [InlineData("MotDePasseSansChiffre!")] // pas de chiffre
    [InlineData("MotDePasseSansSpecial123")] // pas de caractère spécial
    public async Task ExecuterAsync_NouveauMotDePasseNeRespectePasLaPolitique_LeveErreurApplicationExceptionRegleMetierViolee(
        string nouveauMotDePasse)
    {
        var (utilisateurRepository, utilisateur, hasher) = await CreerUtilisateurExistantAsync();
        var ancienHash = utilisateur.MotDePasseHash;
        var useCase = new ChangerMotDePasse(utilisateurRepository, hasher);

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(() => useCase.ExecuterAsync(
            new ChangerMotDePasseRequest(utilisateur.Id, MotDePasseActuel, nouveauMotDePasse),
            TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RegleMetierViolee, exception.Type);
        Assert.Equal(ancienHash, utilisateur.MotDePasseHash);
    }

    [Fact]
    public async Task ExecuterAsync_UtilisateurInexistant_LeveErreurApplicationExceptionRessourceNonTrouvee()
    {
        var utilisateurRepository = new FakeUtilisateurRepository();
        var useCase = new ChangerMotDePasse(utilisateurRepository, new FakeMotDePasseHasher());

        var exception = await Assert.ThrowsAsync<ErreurApplicationException>(() => useCase.ExecuterAsync(
            new ChangerMotDePasseRequest(Guid.NewGuid(), MotDePasseActuel, NouveauMotDePasseValide),
            TestContext.Current.CancellationToken));
        Assert.Equal(TypeErreurApplication.RessourceNonTrouvee, exception.Type);
    }
}
