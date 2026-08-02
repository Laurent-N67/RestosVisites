using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Infrastructure.Persistence.Configurations;

public sealed class UtilisateurConfiguration : IEntityTypeConfiguration<Utilisateur>
{
    public void Configure(EntityTypeBuilder<Utilisateur> builder)
    {
        builder.ToTable("Utilisateurs");

        builder.HasKey(u => u.Id);

        // Identifiant toujours généré côté Domain (constructeur de Utilisateur), jamais par la
        // base : voir le commentaire équivalent dans PhotoConfiguration pour le raisonnement complet.
        builder.Property(u => u.Id)
            .ValueGeneratedNever();

        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(320);

        builder.HasIndex(u => u.Email)
            .IsUnique();

        builder.Property(u => u.NomAffiche)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.MotDePasseHash)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(u => u.MotDePasseSel)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(u => u.MotDePasseIterations)
            .IsRequired();

        // Stocké en texte (plutôt qu'en entier brut) pour rester lisible directement en base et ne
        // pas dépendre de l'ordre de déclaration des valeurs de l'enum.
        builder.Property(u => u.Role)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);
    }
}
