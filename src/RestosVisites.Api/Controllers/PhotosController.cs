using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestosVisites.Application.Abstractions;

namespace RestosVisites.Api.Controllers;

/// <summary>
/// Gère l'upload direct de fichiers image (par opposition au simple collage d'une URL de photo,
/// déjà supporté partout ailleurs via un champ texte). Le fichier est stocké sur disque et une URL
/// relative est retournée, utilisable ensuite exactement comme n'importe quelle URL de photo.
/// </summary>
[ApiController]
[Route("api/photos")]
[Authorize]
public sealed class PhotosController : ControllerBase
{
    // Volontairement limité aux formats image courants et sans dépendance externe : la validation se
    // fait à la fois sur le Content-Type déclaré par le client et sur la signature binaire (magic
    // bytes) réelle du fichier, afin qu'un fichier malveillant renommé/re-typé en image soit rejeté.
    private static readonly Dictionary<string, string> ExtensionsParTypeMime = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/jpeg"] = ".jpg",
        ["image/png"] = ".png",
        ["image/webp"] = ".webp",
    };

    private const long TailleMaxFichierOctets = 50 * 1024 * 1024; // 50 Mo
    // Légère marge par rapport à la taille max du fichier, pour absorber l'en-tête multipart/form-data.
    private const long TailleMaxRequeteOctets = TailleMaxFichierOctets + 64 * 1024;

    private readonly IPhotoStorage _photoStorage;

    public PhotosController(IPhotoStorage photoStorage)
    {
        _photoStorage = photoStorage;
    }

    /// <summary>Upload une photo (multipart/form-data, champ "file") et retourne son URL relative.</summary>
    [HttpPost]
    [RequestSizeLimit(TailleMaxRequeteOctets)]
    [ProducesResponseType(typeof(UploaderPhotoResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UploaderPhotoResponse>> Uploader(IFormFile? file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest("Aucun fichier fourni.");
        }

        if (file.Length > TailleMaxFichierOctets)
        {
            return BadRequest("Le fichier dépasse la taille maximale autorisée (50 Mo).");
        }

        if (!ExtensionsParTypeMime.TryGetValue(file.ContentType, out var extension))
        {
            return BadRequest("Type de fichier non autorisé. Formats acceptés : JPEG, PNG, WebP.");
        }

        await using var contenu = file.OpenReadStream();
        if (!await CorrespondALaSignatureAttendueAsync(contenu, file.ContentType, ct))
        {
            return BadRequest("Le contenu du fichier ne correspond pas à une image valide.");
        }

        var url = await _photoStorage.EnregistrerAsync(contenu, extension, ct);

        return Created(url, new UploaderPhotoResponse(url));
    }

    /// <summary>
    /// Vérifie que les premiers octets du fichier correspondent à la signature binaire attendue pour
    /// le type MIME déclaré, plutôt que de faire confiance uniquement à ce que le client annonce.
    /// </summary>
    private static async Task<bool> CorrespondALaSignatureAttendueAsync(Stream contenu, string typeMimeDeclare, CancellationToken ct)
    {
        var enTete = new byte[12];
        var octetsLus = await contenu.ReadAsync(enTete.AsMemory(0, enTete.Length), ct);
        contenu.Position = 0;

        return typeMimeDeclare.ToLowerInvariant() switch
        {
            "image/jpeg" => octetsLus >= 3
                && enTete[0] == 0xFF && enTete[1] == 0xD8 && enTete[2] == 0xFF,
            "image/png" => octetsLus >= 8
                && enTete.AsSpan(0, 8).SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }),
            "image/webp" => octetsLus >= 12
                && enTete.AsSpan(0, 4).SequenceEqual("RIFF"u8)
                && enTete.AsSpan(8, 4).SequenceEqual("WEBP"u8),
            _ => false,
        };
    }
}

/// <summary>Réponse retournée après l'upload réussi d'une photo.</summary>
public sealed record UploaderPhotoResponse(string Url);
