using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Infrastructure.Persistence.Configurations;

public sealed class CategorieConfiguration : IEntityTypeConfiguration<Categorie>
{
    public void Configure(EntityTypeBuilder<Categorie> builder)
    {
        builder.ToTable("Categories");

        builder.HasKey(c => c.Id);

        // Identifiant toujours généré côté Domain (constructeur de Categorie), jamais par la base :
        // voir le commentaire équivalent dans PhotoConfiguration pour le raisonnement complet.
        builder.Property(c => c.Id)
            .ValueGeneratedNever();

        builder.Property(c => c.Nom)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(c => c.Nom)
            .IsUnique();
    }
}
