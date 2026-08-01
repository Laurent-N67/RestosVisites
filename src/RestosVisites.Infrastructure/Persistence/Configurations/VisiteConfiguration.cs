using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestosVisites.Domain.Entities;
using RestosVisites.Domain.ValueObjects;

namespace RestosVisites.Infrastructure.Persistence.Configurations;

public sealed class VisiteConfiguration : IEntityTypeConfiguration<Visite>
{
    public void Configure(EntityTypeBuilder<Visite> builder)
    {
        builder.ToTable("Visites");

        builder.HasKey(v => v.Id);

        // Identifiant toujours généré côté Domain (constructeur de Visite), jamais par la base :
        // voir le commentaire équivalent dans PhotoConfiguration pour le raisonnement complet.
        builder.Property(v => v.Id)
            .ValueGeneratedNever();

        builder.Property(v => v.RestaurantId)
            .IsRequired();

        builder.Property(v => v.Date)
            .IsRequired();

        builder.Property(v => v.Commentaire)
            .HasMaxLength(2000);

        // Note est un value object (record) à une seule valeur : conversion directe vers/depuis int,
        // plus simple ici qu'un owned type pour une seule colonne.
        builder.Property(v => v.Note)
            .HasConversion(note => note.Valeur, valeur => new Note(valeur))
            .IsRequired()
            .HasColumnName("Note");

        // FK explicite vers Restaurant, sans navigation exposée côté Visite (le Domain n'expose pas
        // de référence directe à l'entité Restaurant, seulement son identifiant).
        builder.HasOne<Restaurant>()
            .WithMany()
            .HasForeignKey(v => v.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        // Une visite possède ses photos (one-to-many, FK shadow "VisiteId" car Photo n'a pas de
        // référence à sa visite dans le Domain). La collection est privée (_photos) : on demande à
        // EF Core de matérialiser/muter directement le champ plutôt que la propriété en lecture seule.
        builder.HasMany(v => v.Photos)
            .WithOne()
            .HasForeignKey("VisiteId")
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(v => v.Photos)
            .UsePropertyAccessMode(PropertyAccessMode.Field);

        // Une catégorie est réutilisée entre plusieurs visites : many-to-many via une table de jointure.
        builder.HasMany(v => v.Categories)
            .WithMany()
            .UsingEntity(joinBuilder => joinBuilder.ToTable("VisiteCategories"));

        builder.Navigation(v => v.Categories)
            .UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
