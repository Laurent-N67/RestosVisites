using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Infrastructure.Persistence.Configurations;

public sealed class FavoriRestaurantConfiguration : IEntityTypeConfiguration<FavoriRestaurant>
{
    public void Configure(EntityTypeBuilder<FavoriRestaurant> builder)
    {
        builder.ToTable("FavorisRestaurants");

        builder.HasKey(f => f.Id);

        // Identifiant toujours généré côté Domain (constructeur de FavoriRestaurant), jamais par la
        // base : voir le commentaire équivalent dans PhotoConfiguration pour le raisonnement complet.
        builder.Property(f => f.Id)
            .ValueGeneratedNever();

        builder.Property(f => f.UtilisateurId)
            .IsRequired();

        builder.Property(f => f.RestaurantId)
            .IsRequired();

        builder.Property(f => f.DateAjout)
            .IsRequired();

        // Pas de fonctionnalité de suppression d'utilisateur ou de restaurant en cascade décrite
        // ailleurs pour les favoris : un favori n'a de sens que tant que son utilisateur et son
        // restaurant existent, donc Cascade (contrairement à Visite.UtilisateurId, volontairement
        // en Restrict pour ne jamais effacer un historique de visites).
        builder.HasOne<Utilisateur>()
            .WithMany()
            .HasForeignKey(f => f.UtilisateurId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Restaurant>()
            .WithMany()
            .HasForeignKey(f => f.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        // Un même restaurant ne peut être favori qu'une seule fois par utilisateur.
        builder.HasIndex(f => new { f.UtilisateurId, f.RestaurantId })
            .IsUnique();
    }
}
