using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using RestosVisites.Api.Middleware;
using RestosVisites.Application.UseCases.CreerRestaurant;
using RestosVisites.Application.UseCases.EnregistrerVisite;
using RestosVisites.Application.UseCases.ListerCategories;
using RestosVisites.Application.UseCases.ListerRestaurants;
using RestosVisites.Application.UseCases.ListerToutesLesVisites;
using RestosVisites.Application.UseCases.ListerVisitesRestaurant;
using RestosVisites.Application.UseCases.ModifierRestaurant;
using RestosVisites.Application.UseCases.ModifierVisite;
using RestosVisites.Application.UseCases.SupprimerRestaurant;
using RestosVisites.Application.UseCases.SupprimerVisite;
using RestosVisites.Infrastructure;
using RestosVisites.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

const string NomPolitiqueCorsClient = "ClientReact";

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddInfrastructure(builder.Configuration);

// En production, ce chemin pointe vers le volume persistant monté (ex: /data/uploads) via la
// configuration "PhotoStorage:DossierRacine" ; par défaut (dev), les photos vont dans wwwroot/uploads.
// IsNullOrWhiteSpace (pas juste ??) : une variable d'environnement absente peut atterrir ici comme
// chaîne vide selon la source de configuration, pas seulement comme null.
var dossierUploadsConfigure = builder.Configuration["PhotoStorage:DossierRacine"];
var dossierUploads = string.IsNullOrWhiteSpace(dossierUploadsConfigure)
    ? Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "uploads")
    : dossierUploadsConfigure;
Console.WriteLine($"[RestosVisites] Dossier de stockage des photos : {dossierUploads}");
builder.Services.AddPhotoStorage(dossierUploads);

builder.Services.AddScoped<CreerRestaurant>();
builder.Services.AddScoped<ListerCategories>();
builder.Services.AddScoped<ListerRestaurants>();
builder.Services.AddScoped<ListerVisitesRestaurant>();
builder.Services.AddScoped<ListerToutesLesVisites>();
builder.Services.AddScoped<EnregistrerVisite>();
builder.Services.AddScoped<ModifierRestaurant>();
builder.Services.AddScoped<SupprimerRestaurant>();
builder.Services.AddScoped<ModifierVisite>();
builder.Services.AddScoped<SupprimerVisite>();

builder.Services.AddExceptionHandler<ErreurApplicationExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services.AddCors(options =>
{
    options.AddPolicy(NomPolitiqueCorsClient, policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Derrière le reverse proxy de la plateforme d'hébergement (TLS terminé en amont), pour que
// UseHttpsRedirection() et le reste du pipeline voient le bon schéma/IP d'origine. Par défaut,
// ASP.NET Core n'accepte les en-têtes X-Forwarded-* que depuis le loopback local : le proxy d'edge
// de la plateforme n'en fait pas partie, donc KnownNetworks/KnownProxies doivent être vidés pour que
// ce middleware fasse réellement quelque chose. Acceptable ici : le conteneur n'est joignable que via
// ce proxy (pas exposé publiquement autrement).
var forwardedHeadersOptions = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
};
forwardedHeadersOptions.KnownIPNetworks.Clear();
forwardedHeadersOptions.KnownProxies.Clear();
app.UseForwardedHeaders(forwardedHeadersOptions);

// Migrations appliquées au démarrage (Development + Production ; idempotent, no-op si déjà à jour).
// Exclu de l'environnement "Testing" : RestosVisitesWebApplicationFactory crée son propre schéma
// via EnsureCreated() sur une base en mémoire, sans historique de migrations.
if (!app.Environment.IsEnvironment("Testing"))
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<RestosVisitesDbContext>();
    dbContext.Database.Migrate();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseExceptionHandler();

app.UseHttpsRedirection();

// Le dossier d'upload est créé au démarrage : il n'existe pas dans le dépôt (contenu utilisateur,
// exclu du contrôle de version), UseStaticFiles/écriture disque échoueraient sinon.
Directory.CreateDirectory(dossierUploads);

// Sert le client React buildé (wwwroot/index.html + assets) comme page d'accueil.
app.UseDefaultFiles();
app.UseStaticFiles();

// Mapping dédié pour les photos uploadées : le dossier peut être en dehors de wwwroot en production
// (volume persistant), donc pas nécessairement couvert par le UseStaticFiles() ci-dessus.
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(dossierUploads),
    RequestPath = "/uploads",
});

app.UseCors(NomPolitiqueCorsClient);

app.UseAuthorization();

app.MapControllers();

app.Run();

// Rend la classe Program générée par les top-level statements accessible depuis les tests
// d'intégration, afin que WebApplicationFactory<Program> puisse la référencer.
public partial class Program;
