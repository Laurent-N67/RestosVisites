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
    }
}
