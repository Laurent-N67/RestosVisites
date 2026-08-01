using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Infrastructure.Persistence.Configurations;

public sealed class RestaurantConfiguration : IEntityTypeConfiguration<Restaurant>
{
    public void Configure(EntityTypeBuilder<Restaurant> builder)
    {
        builder.ToTable("Restaurants");

        builder.HasKey(r => r.Id);

        // Identifiant toujours généré côté Domain (constructeur de Restaurant), jamais par la
        // base : voir le commentaire équivalent dans PhotoConfiguration pour le raisonnement complet.
        builder.Property(r => r.Id)
            .ValueGeneratedNever();

        builder.Property(r => r.Nom)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(r => r.Adresse)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(r => r.Latitude)
            .IsRequired();

        builder.Property(r => r.Longitude)
            .IsRequired();

        // Un restaurant est rattaché à un ensemble de catégories du catalogue prédéfini,
        // réutilisées entre plusieurs restaurants : many-to-many via une table de jointure.
        builder.HasMany(r => r.Categories)
            .WithMany()
            .UsingEntity(joinBuilder => joinBuilder.ToTable("RestaurantCategories"));

        builder.Navigation(r => r.Categories)
            .UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
