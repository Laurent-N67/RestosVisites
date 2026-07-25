using Microsoft.EntityFrameworkCore;
using RestosVisites.Api.Middleware;
using RestosVisites.Application.UseCases.CreerRestaurant;
using RestosVisites.Application.UseCases.EnregistrerVisite;
using RestosVisites.Application.UseCases.ListerRestaurants;
using RestosVisites.Application.UseCases.ListerVisitesRestaurant;
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

builder.Services.AddScoped<CreerRestaurant>();
builder.Services.AddScoped<ListerRestaurants>();
builder.Services.AddScoped<ListerVisitesRestaurant>();
builder.Services.AddScoped<EnregistrerVisite>();

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

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<RestosVisitesDbContext>();
    dbContext.Database.Migrate();
}

app.UseExceptionHandler();

app.UseHttpsRedirection();

app.UseCors(NomPolitiqueCorsClient);

app.UseAuthorization();

app.MapControllers();

app.Run();
