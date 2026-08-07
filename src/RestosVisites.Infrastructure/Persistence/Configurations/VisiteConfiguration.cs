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

        builder.Property(v => v.UtilisateurId)
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

        // Stockés en texte (plutôt qu'en entier brut) pour rester lisibles directement en base et
        // ne pas dépendre de l'ordre de déclaration des valeurs de l'enum, comme Utilisateur.Role.
        builder.Property(v => v.AvecQui)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(v => v.Reservation)
            .HasConversion<string>()
            .HasMaxLength(20);

        // Précision explicite plutôt que de dépendre de l'affinité numérique par défaut de SQLite
        // pour une valeur monétaire.
        builder.Property(v => v.Budget)
            .HasColumnType("decimal(10,2)");

        // FK explicite vers Restaurant, sans navigation exposée côté Visite (le Domain n'expose pas
        // de référence directe à l'entité Restaurant, seulement son identifiant).
        builder.HasOne<Restaurant>()
            .WithMany()
            .HasForeignKey(v => v.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        // FK explicite vers Utilisateur, en Restrict (pas Cascade) : le cas d'usage
        // SupprimerUtilisateur supprime déjà explicitement les visites de l'utilisateur avant de
        // supprimer l'utilisateur lui-même (voir SupprimerUtilisateur.ExecuterAsync), donc ce
        // Restrict n'est pas nécessaire à ce chemin-là. Il reste un filet de sécurité délibéré contre
        // tout autre code, moins soigneux, qui supprimerait un utilisateur sans passer par ce cas
        // d'usage et effacerait ainsi silencieusement son historique de visites par cascade.
        builder.HasOne<Utilisateur>()
            .WithMany()
            .HasForeignKey(v => v.UtilisateurId)
            .OnDelete(DeleteBehavior.Restrict);

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
    }
}
