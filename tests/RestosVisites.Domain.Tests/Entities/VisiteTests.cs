using RestosVisites.Domain.Entities;
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
}
