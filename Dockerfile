# ---- Client (React/Vite) ----
FROM node:22-alpine AS client-build
WORKDIR /client
ARG VITE_CARTO_API_KEY
ENV VITE_CARTO_API_KEY=$VITE_CARTO_API_KEY
COPY client/package.json client/package-lock.json* ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---- Api (.NET) ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api-build
WORKDIR /src
COPY src/RestosVisites.Domain/RestosVisites.Domain.csproj RestosVisites.Domain/
COPY src/RestosVisites.Application/RestosVisites.Application.csproj RestosVisites.Application/
COPY src/RestosVisites.Infrastructure/RestosVisites.Infrastructure.csproj RestosVisites.Infrastructure/
COPY src/RestosVisites.Api/RestosVisites.Api.csproj RestosVisites.Api/
RUN dotnet restore RestosVisites.Api/RestosVisites.Api.csproj
COPY src/ .
RUN dotnet publish RestosVisites.Api/RestosVisites.Api.csproj -c Release -o /app/publish --no-restore

# ---- Final ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
COPY --from=api-build /app/publish .
COPY --from=client-build /client/dist/ ./wwwroot/
ENTRYPOINT ["dotnet", "RestosVisites.Api.dll"]
