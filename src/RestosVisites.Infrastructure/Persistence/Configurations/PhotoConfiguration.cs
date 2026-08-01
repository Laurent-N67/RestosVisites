using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestosVisites.Domain.Entities;

namespace RestosVisites.Infrastructure.Persistence.Configurations;

public sealed class PhotoConfiguration : IEntityTypeConfiguration<Photo>
{
    public void Configure(EntityTypeBuilder<Photo> builder)
    {
        builder.ToTable("Photos");

        builder.HasKey(p => p.Id);

        // L'identifiant est toujours généré côté Domain (constructeur de Photo), jamais par la
        // base ni par EF Core : sans cette configuration, EF Core suppose par défaut qu'une valeur
        // de clé déjà renseignée signifie une entité existante, et tente un UPDATE au lieu d'un
        // INSERT lorsqu'une nouvelle photo est ajoutée à une visite déjà suivie par le contexte
        // (cas de ModifierVisite, qui ne passe pas par un Add() explicite sur le DbSet).
        builder.Property(p => p.Id)
            .ValueGeneratedNever();

        builder.Property(p => p.Url)
            .IsRequired()
            .HasMaxLength(2000);
    }
}
