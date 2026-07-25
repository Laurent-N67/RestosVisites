using RestosVisites.Domain.ValueObjects;

namespace RestosVisites.Domain.Tests.ValueObjects;

public class NoteTests
{
    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(5)]
    public void Constructeur_ValeurValide_CreeLaNote(int valeur)
    {
        var note = new Note(valeur);

        Assert.Equal(valeur, note.Valeur);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    [InlineData(-1)]
    [InlineData(int.MaxValue)]
    public void Constructeur_ValeurHorsBornes_LeveArgumentOutOfRangeException(int valeur)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new Note(valeur));
    }
}
