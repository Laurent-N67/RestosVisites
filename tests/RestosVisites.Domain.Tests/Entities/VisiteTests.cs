using RestosVisites.Domain.Entities;
using RestosVisites.Domain.Enums;
using RestosVisites.Domain.ValueObjects;

namespace RestosVisites.Domain.Tests.Entities;

public class VisiteTests
{
    private static readonly Guid RestaurantIdValide = Guid.NewGuid();
    private static readonly Guid UtilisateurIdValide = Guid.NewGuid();
    private static readonly DateOnly DateValide = new(2026, 1, 15);

    [Fact]
    public void Constructeur_ValeursValides_CreeLaVisite()
    {
        var visite = new Visite(RestaurantIdValide, UtilisateurIdValide, DateValide, new Note(4), "Très bon accueil");

        Assert.NotEqual(Guid.Empty, visite.Id);
        Assert.Equal(RestaurantIdValide, visite.RestaurantId);
        Assert.Equal(UtilisateurIdValide, visite.UtilisateurId);
        Assert.Equal(DateValide, visite.Date);
        Assert.Equal(4, visite.Note.Valeur);
        Assert.Equal("Très bon accueil", visite.Commentaire);
        Assert.Empty(visite.Photos);
    }

    [Fact]
    public void Constructeur_RestaurantIdVide_LeveArgumentException()
    {
        Assert.Throws<ArgumentException>(() => new Visite(Guid.Empty, UtilisateurIdValide, DateValide, new Note(3)));
    }

    [Fact]
    public void Constructeur_UtilisateurIdVide_LeveArgumentException()
    {
        Assert.Throws<ArgumentException>(() => new Visite(RestaurantIdValide, Guid.Empty, DateValide, new Note(3)));
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void Constructeur_CommentaireVideOuBlanc_EstNormaliseANull(string? commentaire)
    {
        var visite = new Visite(RestaurantIdValide, UtilisateurIdValide, DateValide, new Note(3), commentaire);

        Assert.Null(visite.Commentaire);
    }

    [Fact]
    public void Constructeur_CommentaireAvecEspaces_EstTrim()
    {
        var visite = new Visite(RestaurantIdValide, UtilisateurIdValide, DateValide, new Note(3), "  Sympa  ");

        Assert.Equal("Sympa", visite.Commentaire);
    }

    [Fact]
    public void AjouterPhoto_MemePhotoDeuxFois_NAjoutePasDeDoublon()
    {
        var visite = new Visite(RestaurantIdValide, UtilisateurIdValide, DateValide, new Note(3));
        var photo = new Photo("https://exemple.test/photo.jpg");

        visite.AjouterPhoto(photo);
        visite.AjouterPhoto(photo);

        Assert.Single(visite.Photos);
    }

    [Fact]
    public void AjouterPhoto_PhotosDifferentes_AjouteLesDeux()
    {
        var visite = new Visite(RestaurantIdValide, UtilisateurIdValide, DateValide, new Note(3));

        visite.AjouterPhoto(new Photo("https://exemple.test/photo1.jpg"));
        visite.AjouterPhoto(new Photo("https://exemple.test/photo2.jpg"));

        Assert.Equal(2, visite.Photos.Count);
    }

    [Fact]
    public void SupprimerPhoto_PhotoPresente_LaRetire()
    {
        var visite = new Visite(RestaurantIdValide, UtilisateurIdValide, DateValide, new Note(3));
        var photo = new Photo("https://exemple.test/photo.jpg");
        visite.AjouterPhoto(photo);

        visite.SupprimerPhoto(photo.Id);

        Assert.Empty(visite.Photos);
    }

    [Fact]
    public void SupprimerPhoto_IdAbsent_NaAucunEffet()
    {
        var visite = new Visite(RestaurantIdValide, UtilisateurIdValide, DateValide, new Note(3));
        var photo = new Photo("https://exemple.test/photo.jpg");
        visite.AjouterPhoto(photo);

        visite.SupprimerPhoto(Guid.NewGuid());

        Assert.Single(visite.Photos);
    }

    [Fact]
    public void Modifier_ValeursValides_MetAJourLesProprietes()
    {
        var visite = new Visite(RestaurantIdValide, UtilisateurIdValide, DateValide, new Note(3), "Correct");
        var nouvelleDate = new DateOnly(2026, 2, 1);

        visite.Modifier(nouvelleDate, new Note(5), "Excellent accueil");

        Assert.Equal(nouvelleDate, visite.Date);
        Assert.Equal(5, visite.Note.Valeur);
        Assert.Equal("Excellent accueil", visite.Commentaire);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void Modifier_CommentaireVideOuBlanc_EstNormaliseANull(string? commentaire)
    {
        var visite = new Visite(RestaurantIdValide, UtilisateurIdValide, DateValide, new Note(3), "Correct");

        visite.Modifier(DateValide, new Note(4), commentaire);

        Assert.Null(visite.Commentaire);
    }

    [Fact]
    public void Modifier_CommentaireAvecEspaces_EstTrim()
    {
        var visite = new Visite(RestaurantIdValide, UtilisateurIdValide, DateValide, new Note(3));

        visite.Modifier(DateValide, new Note(4), "  Sympa  ");

        Assert.Equal("Sympa", visite.Commentaire);
    }

    [Fact]
    public void Modifier_NoteNull_LeveArgumentNullException()
    {
        var visite = new Visite(RestaurantIdValide, UtilisateurIdValide, DateValide, new Note(3));

        Assert.Throws<ArgumentNullException>(() => visite.Modifier(DateValide, null!, null));
    }

    [Fact]
    public void Constructeur_AvecTousLesDetailsRenseignes_LesStocke()
    {
        var visite = new Visite(
            RestaurantIdValide, UtilisateurIdValide, DateValide, new Note(4), "Sympa",
            Compagnie.Amis, Reservation.Oui, 42.50m, 15);

        Assert.Equal(Compagnie.Amis, visite.AvecQui);
        Assert.Equal(Reservation.Oui, visite.Reservation);
        Assert.Equal(42.50m, visite.Budget);
        Assert.Equal(15, visite.TempsAttente);
    }

    [Fact]
    public void Constructeur_SansDetails_LesLaisseANull()
    {
        var visite = new Visite(RestaurantIdValide, UtilisateurIdValide, DateValide, new Note(4));

        Assert.Null(visite.AvecQui);
        Assert.Null(visite.Reservation);
        Assert.Null(visite.Budget);
        Assert.Null(visite.TempsAttente);
    }

    [Fact]
    public void Constructeur_BudgetNegatif_LeveArgumentOutOfRangeException()
    {
        Assert.Throws<ArgumentOutOfRangeException>(
            () => new Visite(RestaurantIdValide, UtilisateurIdValide, DateValide, new Note(3), budget: -1m));
    }

    [Fact]
    public void Constructeur_TempsAttenteNegatif_LeveArgumentOutOfRangeException()
    {
        Assert.Throws<ArgumentOutOfRangeException>(
            () => new Visite(RestaurantIdValide, UtilisateurIdValide, DateValide, new Note(3), tempsAttente: -1));
    }

    [Fact]
    public void Modifier_AvecTousLesDetailsRenseignes_LesMetAJour()
    {
        var visite = new Visite(RestaurantIdValide, UtilisateurIdValide, DateValide, new Note(3));

        visite.Modifier(DateValide, new Note(4), "Correct", Compagnie.Famille, Reservation.Non, 30m, 5);

        Assert.Equal(Compagnie.Famille, visite.AvecQui);
        Assert.Equal(Reservation.Non, visite.Reservation);
        Assert.Equal(30m, visite.Budget);
        Assert.Equal(5, visite.TempsAttente);
    }

    [Fact]
    public void Modifier_SansDetails_LesReinitialiseANull()
    {
        var visite = new Visite(
            RestaurantIdValide, UtilisateurIdValide, DateValide, new Note(3), avecQui: Compagnie.Seul,
            reservation: Reservation.Oui, budget: 20m, tempsAttente: 10);

        visite.Modifier(DateValide, new Note(4), null);

        Assert.Null(visite.AvecQui);
        Assert.Null(visite.Reservation);
        Assert.Null(visite.Budget);
        Assert.Null(visite.TempsAttente);
    }

    [Fact]
    public void Modifier_BudgetNegatif_LeveArgumentOutOfRangeException()
    {
        var visite = new Visite(RestaurantIdValide, UtilisateurIdValide, DateValide, new Note(3));

        Assert.Throws<ArgumentOutOfRangeException>(
            () => visite.Modifier(DateValide, new Note(4), null, budget: -1m));
    }

    [Fact]
    public void Modifier_TempsAttenteNegatif_LeveArgumentOutOfRangeException()
    {
        var visite = new Visite(RestaurantIdValide, UtilisateurIdValide, DateValide, new Note(3));

        Assert.Throws<ArgumentOutOfRangeException>(
            () => visite.Modifier(DateValide, new Note(4), null, tempsAttente: -1));
    }
}
